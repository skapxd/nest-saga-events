import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { EmitsEvent } from '#/src/saga-event-module/decorators/emits-event.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';
import { UploadVideoDto } from '../video/dto/upload-video.dto';

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  @OnEventDoc('video.uploaded')
  @EmitsEvent({
    onSuccess: {
      name: 'thumbnail.generated.success',
      description: 'Fired when a video thumbnail is generated.',
    },
    onFailure: {
      name: 'thumbnail.generated.failure',
      description: 'Fired if thumbnail generation fails.',
    },
  })
  handleVideoUploaded(@CausationEvent() payload: EventPayload<UploadVideoDto>) {
    this.logger.log('--- Thumbnail Service: Starting ---');
    this.logger.log(`Generating thumbnail for: ${payload.data.fileName}`);
    this.logger.log('Correlation ID:', payload.metadata.correlationId);

    // Simulate a quick process
    const thumbnailPath = `${payload.data.path.replace('.mp4', '')}_thumb.jpg`;

    this.logger.log(`Thumbnail generated at: ${thumbnailPath}`);
    return { ...payload.data, thumbnailPath };
  }
}
