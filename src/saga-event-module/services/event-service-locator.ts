import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventMetadataHelper } from './event-metadata.helper';

interface EventServices {
  eventEmitter: EventEmitter2;
  metadataHelper: EventMetadataHelper;
}

/**
 * A Service Locator pattern implementation (as a Singleton) to provide
 * global access to event-related services for decorators, which operate
 * outside the standard DI lifecycle.
 *
 * This avoids the need for static properties on modules or forcing services
 * to extend a base class.
 *
 * It must be initialized once at the application's root (e.g., in AppModule or a GlobalModule).
 */
@Injectable()
export class EventServiceLocator {
  private static instance: EventServiceLocator | null = null;
  private static readonly logger = new Logger(EventServiceLocator.name);

  public readonly eventEmitter: EventEmitter2;
  public readonly metadataHelper: EventMetadataHelper;

  private constructor(services: EventServices) {
    this.eventEmitter = services.eventEmitter;
    this.metadataHelper = services.metadataHelper;
  }

  /**
   * Initializes the singleton instance with the necessary services.
   * This method is idempotent: it only allows the first initialization to succeed,
   * giving priority to the test environment setup.
   * @param services The services to be stored in the locator.
   */
  public static initialize(services: EventServices): void {
    if (this.instance) {
      this.logger.warn(
        'EventServiceLocator is already initialized. The existing instance (likely from a test setup) will be used.',
      );
      return; // Do not overwrite the existing instance
    }
    this.instance = new EventServiceLocator(services);
    this.logger.log('EventServiceLocator initialized successfully.');
  }

  /**
   * Returns the singleton instance of the EventServiceLocator.
   * @throws Error if the locator has not been initialized.
   * @returns The singleton instance.
   */
  public static getInstance(): EventServiceLocator {
    if (!this.instance) {
      throw new Error(
        'EventServiceLocator has not been initialized. Please call initialize() in your root module.',
      );
    }
    return this.instance;
  }
}
