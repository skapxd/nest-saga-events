import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { CAUSATION_EVENT_PARAM_INDEX } from './causation-event.decorator';
import { EventPayload } from '../interfaces/event.interfaces';
import { AppEventName } from '../types';
import { EventServiceLocator } from '../services/event-service-locator';

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

export const EmitsEvent = (options: {
  onInit?: EventDefinition;
  onSuccess: EventDefinition;
  onFailure: EventDefinition;
}): MethodDecorator => {
  const logger = new Logger(EmitsEvent.name);

  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value as (...args: any[]) => Promise<any>;

    const className = target.constructor.name;
    const methodName = String(propertyKey);

    // Añadimos el nuevo metadato al array y lo guardamos de vuelta en el CONSTRUCTOR
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
        eventEmitter.emit(options.onInit.name, initPayload);
        logger.debug(
          `EVENT: ${options.onInit.name} | EventID: ${initPayload.metadata.eventId}`,
        );
      }

      try {
        const result = (await originalMethod.apply(this, args)) as T;
        const successPayload: EventPayload<T> = { metadata, data: result };
        eventEmitter.emit(options.onSuccess.name, successPayload);

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

        eventEmitter.emit(options.onFailure.name, failurePayload);
        // Explicitly return nothing to satisfy the void part of the union type
        return;
      }
    };

    return descriptor;
  };
};
