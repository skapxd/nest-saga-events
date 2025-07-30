import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RequestContextService } from './request-context.service';
import { Actor, EventMetadata } from '../interfaces/event.interfaces';

@Injectable()
export class EventMetadataHelper {
  constructor(private readonly context: RequestContextService) {}

  createFromContext(): EventMetadata {
    const eventId = randomUUID();
    const actor = this.context.get<Actor>('actor') ?? {
      type: 'system',
      id: 'system',
    };
    const correlationId = this.context.get<string>('correlationId') || eventId;
    return {
      eventId,
      correlationId,
      causationId: null,
      actor,
      timestamp: new Date(),
    };
  }

  createFromPrevious(previous: EventMetadata): EventMetadata {
    return {
      eventId: randomUUID(),
      correlationId: previous.correlationId,
      causationId: previous.eventId,
      actor: previous.actor,
      timestamp: new Date(),
    };
  }
}
