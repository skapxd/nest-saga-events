import { OnEvent } from '@nestjs/event-emitter';
// import { SagaRegistryService } from '../services/saga-registry.service';

export const OnEventDoc = (
  eventName: string,
  options?: any,
): MethodDecorator => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const className = target.constructor.name;
    const methodName = propertyKey.toString();

    // This is a placeholder for the actual implementation
    // We will need to find a way to inject SagaRegistryService here
    // For now, we will just call the OnEvent decorator
    console.log(
      `Registered listener for event ${eventName} on ${className}.${methodName}`,
    );

    return OnEvent(eventName, options)(target, propertyKey, descriptor);
  };
};
