import { OnEvent } from '@nestjs/event-emitter';
import { OnEventOptions } from '@nestjs/event-emitter/dist/interfaces';
import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { AppEventName } from '../types';

export const ON_EVENT_DOC_METADATA_KEY = Symbol('ON_EVENT_DOC_METADATA_KEY');

export interface OnEventDocMetadata {
  eventName: AppEventName;
  methodName: string;
  className: string;
}

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

    // 1. Add metadata to the constructor for unified discovery
    const existingMetadataList =
      (Reflect.getMetadata(
        ON_EVENT_DOC_METADATA_KEY,
        target.constructor,
      ) as OnEventDocMetadata[]) || [];

    const newMetadata: OnEventDocMetadata = {
      eventName,
      methodName,
      className,
    };

    Reflect.defineMetadata(
      ON_EVENT_DOC_METADATA_KEY,
      [...existingMetadataList, newMetadata],
      target.constructor,
    );

    logger.log(
      `Registered listener for event ${eventName} on ${className}.${methodName}`,
    );

    // 2. Call the original @OnEvent decorator to ensure functionality
    const asyncOptions = { ...options, async: true, suppressErrors: false };
    return OnEvent(eventName, asyncOptions)(target, propertyKey, descriptor);
  };
};
