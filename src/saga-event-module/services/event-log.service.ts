import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayload } from '../interfaces/event.interfaces';
import { JsonDatabaseService } from '#/database/json/json-database.service';

@Injectable()
export class EventLogService implements OnModuleInit {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly dbService: JsonDatabaseService,
  ) {}

  onModuleInit() {
    this.eventEmitter.onAny(
      (eventName: string, payload: { data: any; metadata: any }) => {
        // Exclude internal NestJS events
        if (eventName.startsWith('Nest')) return;

        void this.handleAllEvents(eventName, payload);
      },
    );
  }

  private async handleAllEvents(eventName: string, payload: EventPayload<any>) {
    if (payload && payload.metadata) {
      const logEntry = {
        ...payload,
        eventName, // Use the actual event name from the emitter
        timestamp: new Date().toISOString(),
      };
      await this.dbService.addToCollection('events', logEntry);
    }
  }
}
