import {
  Global,
  Module,
  NestModule,
  MiddlewareConsumer,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RequestContextService } from './services/request-context.service';
import { EventMetadataHelper } from './services/event-metadata.helper';
import { EventLogService } from './services/event-log.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayload } from './interfaces/event.interfaces';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { EventGeneratorService } from './services/event-generator.service';

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
    EventGeneratorService,
  ],
  exports: [RequestContextService, EventMetadataHelper, TypedEventEmitter],
})
export class SagaEventModule implements NestModule, OnModuleInit {
  constructor(
    @Inject(EventGeneratorService)
    private readonly eventGeneratorService: EventGeneratorService,
  ) {}

  async onModuleInit() {
    await this.eventGeneratorService.generate();
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
