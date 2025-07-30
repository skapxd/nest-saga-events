import 'reflect-metadata';
import { CAUSATION_EVENT_PARAM_INDEX } from './causation-event.decorator';
import { EventMetadataHelper } from '../services/event-metadata.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayload } from '../interfaces/event.interfaces';

export interface EmitsEventOptions {
  onSuccess: { name: string };
  onFailure: { name: string };
}

export const EmitsEvent = (options: EmitsEventOptions): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // These services would ideally be injected or accessed via a static context
      const eventEmitter = this.eventEmitter as EventEmitter2;
      const metadataHelper = this.eventMetadataHelper as EventMetadataHelper;

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
