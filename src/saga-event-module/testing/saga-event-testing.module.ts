import { Module, Global } from '@nestjs/common';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { vi } from 'vitest';

import { RequestContextService } from '../services/request-context.service';
import { EventMetadataHelper } from '../services/event-metadata.helper';
import { EventLogService } from '../services/event-log.service';
import { EventGeneratorService } from '../services/event-generator.service';
import { EventDocumentationService } from '../services/event-documentation.service';
import { EventServiceLocator } from '../services/event-service-locator';
import { JsonDatabaseService } from '#/src/database/json/json-database.service';

/**
 * A reusable testing module for any test that involves services using the @EmitsEvent decorator.
 *
 * It provides the necessary infrastructure for the event system to work,
 * mocks out dependencies with side effects (database, file system),
 * and correctly initializes the EventServiceLocator singleton for the test environment.
 */
@Global()
@Module({
  imports: [
    DiscoveryModule,
    EventEmitterModule.forRoot({
      global: true,
      wildcard: true,
      delimiter: '.',
    }),
  ],
  providers: [
    RequestContextService,
    EventMetadataHelper,
    EventLogService,
    {
      provide: JsonDatabaseService,
      useValue: {
        addToCollection: vi.fn().mockResolvedValue(undefined),
        getCollection: vi.fn().mockResolvedValue([]),
      },
    },
    {
      provide: EventGeneratorService,
      useValue: {
        generate: vi.fn().mockResolvedValue(undefined),
      },
    },
    {
      provide: EventDocumentationService,
      useValue: {
        generate: vi.fn().mockResolvedValue(undefined),
        getFlowGraph: vi.fn(),
        getSagaStarters: vi.fn(),
      },
    },
  ],
  exports: [EventEmitterModule, RequestContextService, EventMetadataHelper],
})
export class SagaEventTestingModule {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly metadataHelper: EventMetadataHelper,
  ) {
    // Initialize the service locator with the instances provided by the test DI container.
    EventServiceLocator.initialize({
      eventEmitter: this.eventEmitter,
      metadataHelper: this.metadataHelper,
    });
  }
}
