import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CAUSATION_EVENT_PARAM_INDEX } from './causation-event.decorator';
import { EventPayload } from '../interfaces/event.interfaces';
import { AppEventName } from '../types';
import { EventServiceLocator } from '../services/event-service-locator';
import { assertIsSerializable } from '../helpers/assert-is-serializable.helper';

export const EMITS_EVENT_METADATA_KEY = Symbol('EMITS_EVENT_METADATA_KEY');

export interface EmitsEventMetadata {
  onInit?: EventDefinition;
  onSuccess: EventDefinition;
  onFailure: EventDefinition;
  className: string;
  methodName: string;
}

interface EventDefinition {
  name: AppEventName;
  description?: string;
  payload?: new (...args: any[]) => any;
}

export interface EmitsEventOptions {
  onInit?: EventDefinition;
  onSuccess: EventDefinition;
  onFailure: EventDefinition;
  /**
   * Optional. If true (default), returning null or undefined from the decorated
   * method will prevent the onSuccess event from being emitted.
   * Set to false to allow events with null or undefined payloads.
   */
  earlyReturn?: boolean;
}

export const EmitsEvent = (options: EmitsEventOptions): MethodDecorator => {
  const logger = new Logger(EmitsEvent.name);
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value as (...args: any[]) => Promise<any>;

    const className = target.constructor.name;
    const methodName = String(propertyKey);

    // Register metadata for documentation generation
    const existingMetadataList =
      (Reflect.getMetadata(
        EMITS_EVENT_METADATA_KEY,
        target.constructor,
      ) as EmitsEventMetadata[]) || [];

    const newMetadata: EmitsEventMetadata = {
      ...options,
      className,
      methodName,
    };

    Reflect.defineMetadata(
      EMITS_EVENT_METADATA_KEY,
      [...existingMetadataList, newMetadata],
      target.constructor,
    );

    // --- Existing logic continues below ---
    descriptor.value = async function <
      T extends Awaited<ReturnType<typeof originalMethod>>,
    >(this: any, ...args: any[]): Promise<T | void> {
      const { eventEmitter, metadataHelper } =
        EventServiceLocator.getInstance();

      const causationIndex: number | undefined = Reflect.getMetadata(
        CAUSATION_EVENT_PARAM_INDEX,
        target,
        propertyKey,
      );
      let metadata;

      if (causationIndex !== undefined && args[causationIndex]) {
        const causationPayload = args[causationIndex] as EventPayload<any>;
        metadata = metadataHelper.createFromPrevious(causationPayload.metadata);
      } else {
        metadata = metadataHelper.createFromContext();
      }

      // Emit the onInit event if defined
      if (options.onInit) {
        const initPayload: EventPayload<any[]> = { metadata, data: args };
        await eventEmitter.emitAsync(options.onInit.name, initPayload);
        logger.debug(
          `EVENT: ${options.onInit.name} | EventID: ${initPayload.metadata.eventId}`,
        );
      }

      try {
        const result = (await originalMethod.apply(this, args)) as T;

        // Handle early return: if the method returns null/undefined, suppress the event.
        const enableEarlyReturn = options.earlyReturn ?? true; // Default to true
        const resultIsNullish = result === null || result === undefined;
        if (enableEarlyReturn && resultIsNullish) {
          logger.debug(
            `Early return detected for ${className}.${methodName}. Suppressing event emission.`,
          );
          return result; // Exit without emitting event
        }

        // --- VALIDATION LOGIC ---
        let successPayload: EventPayload<T> = { metadata, data: result };

        if (options.onSuccess.payload) {
          // Path 1: DTO is provided, use class-validator for deep validation.
          const payloadInstance = plainToInstance(
            options.onSuccess.payload,
            successPayload,
          );

          await validationPipe.transform(payloadInstance, {
            metatype: options.onSuccess.payload,
            type: 'custom',
          });

          successPayload = payloadInstance as EventPayload<T>;
        } else {
          // Path 2: No DTO provided, perform a general serialization check.
          assertIsSerializable(result, `${className}.${methodName}`);
        }
        // --- END VALIDATION LOGIC ---

        await eventEmitter.emitAsync(options.onSuccess.name, successPayload);

        logger.debug(
          `EVENT: ${options.onSuccess.name} | EventID: ${successPayload.metadata.eventId}`,
        );

        return result;
      } catch (error) {
        const failurePayload: EventPayload<any> = { metadata, data: error };

        logger.error(
          `EVENT: ${options.onFailure.name} | EventID: ${failurePayload.metadata.eventId}`,
        );
        logger.error(error);

        await eventEmitter.emitAsync(options.onFailure.name, failurePayload);
        // Explicitly return nothing to satisfy the void part of the union type
        return;
      }
    };

    return descriptor;
  };
};
