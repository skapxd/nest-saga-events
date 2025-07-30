import 'reflect-metadata';

export const EVENT_METADATA_PARAM_INDEX = Symbol('EventMetadataParamIndex');

export const EventMetadata = (): ParameterDecorator => {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey) {
      Reflect.defineMetadata(
        EVENT_METADATA_PARAM_INDEX,
        parameterIndex,
        target,
        propertyKey,
      );
    }
  };
};
