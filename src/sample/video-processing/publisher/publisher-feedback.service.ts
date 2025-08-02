import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';

@Injectable()
export class PublisherFeedbackService {
  private readonly logger = new Logger(PublisherFeedbackService.name);

  @OnEventDoc('video.published.failure')
  handlePublishingFailure(@CausationEvent() payload: EventPayload<any>) {
    this.logger.error('--- Publisher Feedback Service: Publishing Failed ---');
    this.logger.error('An error occurred while publishing the video.', {
      correlationId: payload.metadata.correlationId,
      error: payload.data,
    });
  }
}
