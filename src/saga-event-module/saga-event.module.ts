import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RequestContextService } from './services/request-context.service';
import { SagaRegistryService } from './services/saga-registry.service';
import { EventMetadataHelper } from './services/event-metadata.helper';
import { EventLogService } from './services/event-log.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayload } from './interfaces/event.interfaces';

export class TypedEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit<T>(eventName: string, payload: EventPayload<T>) {
    this.eventEmitter.emit(eventName, payload);
  }
}

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      global: true,
      wildcard: true,
      delimiter: '.',
      verboseMemoryLeak: true,
    }),
  ],
  providers: [
    RequestContextService,
    SagaRegistryService,
    EventMetadataHelper,
    EventLogService,
    {
      provide: TypedEventEmitter,
      useFactory: (eventEmitter: EventEmitter2) =>
        new TypedEventEmitter(eventEmitter),
      inject: [EventEmitter2],
    },
  ],
  exports: [
    RequestContextService,
    SagaRegistryService,
    EventMetadataHelper,
    TypedEventEmitter,
  ],
})
export class SagaEventModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
