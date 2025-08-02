import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';

@Injectable()
export class VerificationFeedbackService {
  private readonly logger = new Logger(VerificationFeedbackService.name);

  @OnEventDoc('video.verification.failed')
  handleVerificationFailure(@CausationEvent() payload: EventPayload<any>) {
    this.logger.error(
      '--- Verification Feedback Service: Verification Failed ---',
    );
    this.logger.error('An error occurred during video verification.', {
      correlationId: payload.metadata.correlationId,
      error: payload.data,
    });
    // In a real app, you could send an email, create a Jira ticket, etc.
  }
}
