import { OnEvent } from '@nestjs/event-emitter';
import { OnEventOptions } from '@nestjs/event-emitter/dist/interfaces';
import 'reflect-metadata';

import { Logger, SetMetadata } from '@nestjs/common';
import { AppEventName } from '../types';

export const ON_EVENT_DOC_METADATA_KEY = Symbol('ON_EVENT_DOC_METADATA_KEY');

export const OnEventDoc = (
  eventName: AppEventName,
  options?: OnEventOptions,
): MethodDecorator => {
  const logger = new Logger(OnEventDoc.name);

  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const className = target.constructor.name;
    const methodName = propertyKey.toString();
    SetMetadata(ON_EVENT_DOC_METADATA_KEY, eventName)(
      target,
      propertyKey,
      descriptor,
    );

    logger.log(
      `Registered listener for event ${eventName} on ${className}.${methodName}`,
    );

    const asyncOptions = { ...options, async: true, suppressErrors: false };
    return OnEvent(eventName, asyncOptions)(target, propertyKey, descriptor);
  };
};
