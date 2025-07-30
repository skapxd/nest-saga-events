import 'reflect-metadata';
export const CAUSATION_EVENT_PARAM_INDEX = Symbol('CausationEventParamIndex');
export const CausationEvent = (): ParameterDecorator => {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey) {
      Reflect.defineMetadata(
        CAUSATION_EVENT_PARAM_INDEX,
        parameterIndex,
        target,
        propertyKey,
      );
    }
  };
};
