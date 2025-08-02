import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';

@Injectable()
export class ThumbnailFeedbackService {
  private readonly logger = new Logger(ThumbnailFeedbackService.name);

  @OnEventDoc('thumbnail.generated.failure')
  handleThumbnailFailure(@CausationEvent() payload: EventPayload<any>) {
    this.logger.error(
      '--- Thumbnail Feedback Service: Thumbnail Generation Failed ---',
    );
    this.logger.error('An error occurred during thumbnail generation.');
    this.logger.error({
      correlationId: payload.metadata.correlationId,
      error: payload.data,
    });
  }
}
