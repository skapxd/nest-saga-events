import 'reflect-metadata';
import { CAUSATION_EVENT_PARAM_INDEX } from './causation-event.decorator';
import { EventMetadataHelper } from '../services/event-metadata.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayload } from '../interfaces/event.interfaces';
import { AppEventName } from '../types';

export const EMITS_EVENT_METADATA_KEY = Symbol('EMITS_EVENT_METADATA_KEY');

export interface EmitsEventMetadata {
  onInit?: { name: AppEventName };
  onSuccess: { name: AppEventName };
  onFailure: { name: AppEventName };
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
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

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
    descriptor.value = async function (
      this: {
        eventEmitter: EventEmitter2;
        eventMetadataHelper: EventMetadataHelper;
      },
      ...args: any[]
    ) {
      // These services would ideally be injected or accessed via a static context
      const eventEmitter = this.eventEmitter;
      const metadataHelper = this.eventMetadataHelper;

      if (!eventEmitter || !metadataHelper) {
        throw new Error(
          'EventEmitter2 and EventMetadataHelper must be available on the class instance',
        );
      }

      const causationIndex = Reflect.getMetadata(
        CAUSATION_EVENT_PARAM_INDEX,
        target,
        propertyKey,
      );
      let metadata;

      if (causationIndex !== undefined) {
        const causationPayload = args[causationIndex] as EventPayload<any>;
        metadata = metadataHelper.createFromPrevious(causationPayload.metadata);
      } else {
        metadata = metadataHelper.createFromContext();
      }

      // Emit the onInit event if defined
      if (options.onInit) {
        const initPayload: EventPayload<any[]> = { metadata, data: args };
        eventEmitter.emit(options.onInit.name, initPayload);
      }

      try {
        const result = await originalMethod.apply(this, args);
        const successPayload: EventPayload<any> = { metadata, data: result };
        eventEmitter.emit(options.onSuccess.name, successPayload);
        return result;
      } catch (error) {
        const failurePayload: EventPayload<any> = { metadata, data: error };
        eventEmitter.emit(options.onFailure.name, failurePayload);
        // Do not rethrow the error, as it's been handled by emitting an event.
        // This prevents unhandled promise rejections in fire-and-forget scenarios.
      }
    };

    return descriptor;
  };
};
