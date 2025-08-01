import 'reflect-metadata';
import { AppEventName } from '../types';

export const LOGICAL_AND_GATE_METADATA_KEY = Symbol(
  'LOGICAL_AND_GATE_METADATA_KEY',
);

export interface LogicalAndGateMetadata {
  gateName: string;
  dependsOn: AppEventName[];
  methodName: string;
  className: string;
}

/**
 * Decorator to document a "fan-in" pattern where a method's execution
 * logically depends on the completion of multiple, different events.
 * This creates a logical "AND" gate in the documentation graph.
 *
 * This decorator is for documentation purposes only.
 */
export const LogicalAndGate = (options: {
  name: string;
  dependsOn: AppEventName[];
}): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) => {
    const className = target.constructor.name;
    const methodName = propertyKey.toString();

    const existingMetadataList =
      (Reflect.getMetadata(
        LOGICAL_AND_GATE_METADATA_KEY,
        target.constructor,
      ) as LogicalAndGateMetadata[]) || [];

    const newMetadata: LogicalAndGateMetadata = {
      gateName: options.name,
      dependsOn: options.dependsOn,
      methodName,
      className,
    };

    Reflect.defineMetadata(
      LOGICAL_AND_GATE_METADATA_KEY,
      [...existingMetadataList, newMetadata],
      target.constructor,
    );
  };
};
