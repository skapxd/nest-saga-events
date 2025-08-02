import { randomUUID } from 'crypto';
import {
  EventPayload,
  EventMetadata,
  Actor,
} from '../interfaces/event.interfaces';

/**
 * Creates a mock actor for testing purposes.
 */
export const createMockActor = (
  type: 'user' | 'system' = 'system',
  id = 'test-actor',
): Actor => ({
  type,
  id,
});

/**
 * Creates mock event metadata.
 * @param previousMetadata - Optional. If provided, creates subsequent metadata.
 */
export const createMockMetadata = (
  previousMetadata?: EventMetadata,
): EventMetadata => {
  if (previousMetadata) {
    return {
      eventId: randomUUID(),
      correlationId: previousMetadata.correlationId,
      causationId: previousMetadata.eventId,
      actor: previousMetadata.actor,
      timestamp: new Date(),
    };
  }
  const eventId = randomUUID();
  return {
    eventId,
    correlationId: eventId,
    causationId: null,
    actor: createMockActor(),
    timestamp: new Date(),
  };
};

/**
 * Creates a full EventPayload for a "causation" event (an event that triggers a listener).
 * This is useful for testing services that use `@OnEventDoc`.
 *
 * @param data - The data payload for the event.
 */
export function createCausationEventPayload<T>(data: T): EventPayload<T> {
  const metadata = createMockMetadata();
  return {
    metadata,
    data,
  };
}
