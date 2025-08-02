import {
  Global,
  Module,
  NestModule,
  MiddlewareConsumer,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RequestContextService } from './services/request-context.service';
import { EventMetadataHelper } from './services/event-metadata.helper';
import { EventLogService } from './services/event-log.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { EventGeneratorService } from './services/event-generator.service';
import { EventDocumentationService } from './services/event-documentation.service';

import { EventDocumentationController } from './controllers/event-documentation.controller';
import { EventServiceLocator } from './services/event-service-locator';
import { MermaidParserModule } from '#/src/mermaid-parser/mermaid-parser.module';
import { TypedEventEmitter } from './helpers/typed-event-emitter';

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
    MermaidParserModule,
  ],
  controllers: [EventDocumentationController],
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
    EventDocumentationService,
  ],
  exports: [RequestContextService, EventMetadataHelper, TypedEventEmitter],
})
export class SagaEventModule implements NestModule, OnModuleInit {
  // Propiedades estáticas para acceder desde cualquier lugar
  public static eventEmitter: EventEmitter2;
  public static eventMetadataHelper: EventMetadataHelper;

  constructor(
    private readonly eventGeneratorService: EventGeneratorService,
    private readonly eventDocumentationService: EventDocumentationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventMetadataHelper: EventMetadataHelper,
  ) {
    EventServiceLocator.initialize({
      eventEmitter: this.eventEmitter,
      metadataHelper: this.eventMetadataHelper,
    });
  }

  async onModuleInit() {
    // The order is important. First generate types, then docs.
    await this.eventGeneratorService.generate();
    await this.eventDocumentationService.generate();
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .exclude({ path: 'docs/*path', method: RequestMethod.ALL })
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
