import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';

@Injectable()
export class VideoFeedbackService {
  private readonly logger = new Logger(VideoFeedbackService.name);

  @OnEventDoc('video.upload.failed')
  handleUploadFailure(@CausationEvent() payload: EventPayload<any>) {
    this.logger.error('--- Video Feedback Service: Upload Failed ---');
    this.logger.error(
      'An error occurred during the initial video processing step.',
      {
        correlationId: payload.metadata.correlationId,
        error: payload.data,
      },
    );
  }
}
