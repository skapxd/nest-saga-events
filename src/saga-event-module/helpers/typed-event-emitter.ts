import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayload } from '../interfaces/event.interfaces';
import { AppEventName } from '../types';

export class TypedEventEmitter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit<T>(eventName: AppEventName, payload: EventPayload<T>) {
    this.eventEmitter.emit(eventName, payload);
  }

  emitAsync<T>(eventName: AppEventName, payload: EventPayload<T>) {
    return this.eventEmitter.emitAsync(eventName, payload);
  }

  waitFor(eventName: AppEventName) {
    return this.eventEmitter.waitFor(eventName);
  }
}
