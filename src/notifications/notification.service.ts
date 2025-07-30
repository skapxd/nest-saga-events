// src/notifications/notification.service.ts
import { Injectable } from '@nestjs/common';
import { OnEventDoc } from '../saga-event-module/decorators/on-event-doc.decorator';
import { EventPayload } from '../saga-event-module/interfaces/event.interfaces';
import { CausationEvent } from '../saga-event-module/decorators/causation-event.decorator';

@Injectable()
export class NotificationService {
  @OnEventDoc('user.created.success')
  handleUserCreatedSuccess(
    @CausationEvent()
    payload: EventPayload<{ id: string; name: string; email: string }>,
  ) {
    console.log('--- Notification Service: Success ---');
    console.log(
      `Sending welcome email to ${payload.data.name} (${payload.data.email})`,
    );
    console.log('Correlation ID:', payload.metadata.correlationId);
    console.log('-----------------------------------');
  }

  @OnEventDoc('user.created.failure')
  handleUserCreatedFailure(@CausationEvent() payload: EventPayload<Error>) {
    console.log('--- Notification Service: Failure ---');
    console.log(
      `Notifying admin about user creation failure. Reason: ${payload.data.message}`,
    );
    console.log('Correlation ID:', payload.metadata.correlationId);
    console.log('-----------------------------------');
  }
}
