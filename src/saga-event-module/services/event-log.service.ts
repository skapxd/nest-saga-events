import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayload } from '../interfaces/event.interfaces';
import { JsonDatabaseService } from '#/src/database/json/json-database.service';

@Injectable()
export class EventLogService implements OnModuleInit {
  private readonly logger = new Logger(EventLogService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly dbService: JsonDatabaseService,
  ) {}

  onModuleInit() {
    this.eventEmitter.onAny(
      (eventName: string, payload: { data: any; metadata: any }) => {
        // Exclude internal NestJS events
        if (eventName.startsWith('Nest')) return;

        // Exclude self emits saved events
        if (eventName.toLowerCase().startsWith('log-save')) return;

        void this.handleAllEvents(eventName, payload);
      },
    );
  }

  private async handleAllEvents(eventName: string, payload: EventPayload<any>) {
    if (payload && payload.metadata) {
      try {
        const logEntry = {
          ...payload,
          eventName, // Use the actual event name from the emitter
          timestamp: new Date().toISOString(),
        };
        await this.dbService.addToCollection('events', logEntry);
        await this.eventEmitter.emitAsync(
          `log-save.success.${eventName}`,
          payload,
        );
      } catch (error) {
        this.logger.error(
          `Failed to save log event '${eventName}' into database.`,
          error,
        );
        await this.eventEmitter.emitAsync(
          `log-save.failed.${eventName}`,
          error,
        );
      }
    }
  }
}
