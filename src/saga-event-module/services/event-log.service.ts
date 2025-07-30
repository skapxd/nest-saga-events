import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { appendFile } from 'fs/promises';
import { EventPayload } from '../interfaces/event.interfaces';

@Injectable()
export class EventLogService implements OnModuleInit {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  onModuleInit() {
    this.eventEmitter.onAny(
      (eventName: string, payload: { data: any; metadata: any }) => {
        void this.handleAllEvents({
          metadata: {
            ...payload.metadata,
            eventId: eventName,
          },
          data: payload.data,
        });
      },
    );
  }

  async handleAllEvents(payload: EventPayload<any>) {
    if (payload && payload.metadata) {
      const logEntry = {
        ...payload,
        eventName: payload.metadata.eventId,
        timestamp: new Date().toISOString(),
      };
      await appendFile('event-log.json', JSON.stringify(logEntry) + '\n');
    }
  }
}
