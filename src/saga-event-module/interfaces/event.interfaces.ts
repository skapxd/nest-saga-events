export interface Actor {
  readonly type: 'user' | 'system';
  readonly id: string;
  readonly details?: Record<string, any>;
}

export interface EventMetadata {
  readonly eventId: string;
  readonly correlationId: string;
  readonly causationId: string | null;
  readonly timestamp: Date;
  readonly actor: Actor;
}

export interface EventPayload<T> {
  metadata: EventMetadata;
  data: T;
}
