import 'reflect-metadata';
import { AppEventName } from '../types';

export const DEPENDS_ON_EVENT_METADATA_KEY = Symbol(
  'DEPENDS_ON_EVENT_METADATA_KEY',
);

export interface DependsOnEventMetadata {
  eventName: AppEventName;
  methodName: string;
  className: string;
}

/**
 * Decorator to document that a method has a logical dependency on an event,
 * even if it's not a direct event listener. This is useful for "fan-in"
 * patterns where a method is only called after multiple, different events
 * have been processed.
 *
 * This decorator is for documentation purposes only and does not subscribe
 * the method to any events.
 */
export const DependsOnEvent = (eventName: AppEventName): MethodDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const className = target.constructor.name;
    const methodName = propertyKey.toString();

    const existingMetadataList =
      (Reflect.getMetadata(
        DEPENDS_ON_EVENT_METADATA_KEY,
        target.constructor,
      ) as DependsOnEventMetadata[]) || [];

    const newMetadata: DependsOnEventMetadata = {
      eventName,
      methodName,
      className,
    };

    Reflect.defineMetadata(
      DEPENDS_ON_EVENT_METADATA_KEY,
      [...existingMetadataList, newMetadata],
      target.constructor,
    );
  };
};
