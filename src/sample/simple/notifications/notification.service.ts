// src/notifications/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '../../../saga-event-module/decorators/on-event-doc.decorator';
import { EventPayload } from '../../../saga-event-module/interfaces/event.interfaces';
import { CausationEvent } from '../../../saga-event-module/decorators/causation-event.decorator';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  @OnEventDoc('user.created.success')
  handleUserCreatedSuccess(
    @CausationEvent()
    payload: EventPayload<{ id: string; name: string; email: string }>,
  ) {
    this.logger.log('--- Notification Service: Success ---');
    this.logger.log(
      `Sending welcome email to ${payload.data.name} (${payload.data.email})`,
    );
    this.logger.log('Correlation ID:', payload.metadata.correlationId);
    this.logger.log('-----------------------------------');
  }

  @OnEventDoc('user.created.failure')
  handleUserCreatedFailure(@CausationEvent() payload: EventPayload<Error>) {
    this.logger.log('--- Notification Service: Failure ---');
    this.logger.log(
      `Notifying admin about user creation failure. Reason: ${payload.data.message}`,
    );
    this.logger.log('Correlation ID:', payload.metadata.correlationId);
    this.logger.log('-----------------------------------');
  }
}
