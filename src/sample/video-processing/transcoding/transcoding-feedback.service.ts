import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';

@Injectable()
export class TranscodingFeedbackService {
  private readonly logger = new Logger(TranscodingFeedbackService.name);

  @OnEventDoc('video.transcoded.failure')
  handleTranscodingFailure(@CausationEvent() payload: EventPayload<any>) {
    this.logger.error(
      '--- Transcoding Feedback Service: Transcoding Failed ---',
    );
    this.logger.error('An error occurred during video transcoding.', {
      correlationId: payload.metadata.correlationId,
      error: payload.data,
    });
  }
}
