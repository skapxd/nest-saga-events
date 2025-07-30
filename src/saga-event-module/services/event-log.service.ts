import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { appendFile } from 'fs/promises';
import { EventPayload } from '../interfaces/event.interfaces';

@Injectable()
export class EventLogService {
  @OnEvent('**', { async: true })
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
