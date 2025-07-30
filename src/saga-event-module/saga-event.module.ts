import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RequestContextService } from './services/request-context.service';
import { EventMetadataHelper } from './services/event-metadata.helper';
import { EventLogService } from './services/event-log.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayload } from './interfaces/event.interfaces';
import { GenerateDocsCommand } from './commands/generate-docs.command';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';

export class TypedEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit<T>(eventName: string, payload: EventPayload<T>) {
    this.eventEmitter.emit(eventName, payload);
  }
}

@Global()
@Module({
  imports: [
    DiscoveryModule,
    EventEmitterModule.forRoot({
      global: true,
      wildcard: true,
      delimiter: '.',
      verboseMemoryLeak: true,
    }),
  ],
  providers: [
    RequestContextService,
    EventMetadataHelper,
    EventLogService,
    {
      provide: TypedEventEmitter,
      useFactory: (eventEmitter: EventEmitter2) =>
        new TypedEventEmitter(eventEmitter),
      inject: [EventEmitter2],
    },
    GenerateDocsCommand,
  ],
  exports: [RequestContextService, EventMetadataHelper, TypedEventEmitter],
})
export class SagaEventModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
