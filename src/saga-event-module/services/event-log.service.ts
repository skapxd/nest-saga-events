import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { appendFile, mkdir, rm } from 'fs/promises';
import { EventPayload } from '../interfaces/event.interfaces';

@Injectable()
export class EventLogService implements OnModuleInit {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  onModuleInit() {
    this.eventEmitter.onAny((eventName: string, payload) => {
      this.handleAllEvents({
        metadata: {
          eventId: eventName,
          correlationId: '',
          causationId: null,
          timestamp: new Date(),
          actor: {
            type: 'system',
            id: 'system',
          },
        },
        data: payload.data,
      });
    });
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
