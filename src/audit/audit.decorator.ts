import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const AUDIT_METHOD_START = 'audit.method.start';
export const AUDIT_METHOD_SUCCESS = 'audit.method.success';
export const AUDIT_METHOD_ERROR = 'audit.method.error';

/**
 * Decorator that audits a method execution.
 * It emits events before the method starts, on success, and on error.
 *
 * IMPORTANT: The class using this decorator MUST have a property
 * `public eventEmitter: EventEmitter2` for this to work, as decorators
 * do not have direct access to the NestJS dependency injection container.
 */
export function AuditMethod(): MethodDecorator {
  const logger = new Logger(AuditMethod.name);

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 'this' refers to the instance of the service where the decorator is applied.
      // We rely on the service having 'eventEmitter' injected.
      const eventEmitter = this.eventEmitter as EventEmitter2;

      if (!eventEmitter) {
        logger.error(
          `The class '${target.constructor.name}' using @AuditMethod on '${String(
            propertyKey,
          )}' must have an 'eventEmitter' property of type EventEmitter2.`,
        );
        // Fallback to original method if event emitter is not available
        return originalMethod.apply(this, args);
      }

      const methodName = String(propertyKey);

      eventEmitter.emit(AUDIT_METHOD_START, {
        className: target.constructor.name,
        methodName,
        args,
      });

      try {
        const result = await originalMethod.apply(this, args);

        eventEmitter.emit(AUDIT_METHOD_SUCCESS, {
          className: target.constructor.name,
          methodName,
          result,
        });

        return result;
      } catch (error) {
        eventEmitter.emit(AUDIT_METHOD_ERROR, {
          className: target.constructor.name,
          methodName,
          error,
        });

        throw error;
      }
    };

    return descriptor;
  };
}
