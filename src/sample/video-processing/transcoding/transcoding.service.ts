import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { EmitsEvent } from '#/src/saga-event-module/decorators/emits-event.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';
import { UploadVideoDto } from '../video/dto/upload-video.dto';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class TranscodingService {
  private readonly logger = new Logger(TranscodingService.name);

  @OnEventDoc('video.uploaded')
  @EmitsEvent({
    onSuccess: {
      name: 'video.transcoded.success',
      description: 'Fired when video transcoding is complete.',
    },
    onFailure: {
      name: 'video.transcoded.failure',
      description: 'Fired if video transcoding fails.',
    },
  })
  async handleVideoUploaded(
    @CausationEvent() payload: EventPayload<UploadVideoDto>,
  ) {
    this.logger.log('--- Transcoding Service: Starting ---');
    this.logger.log(`Transcoding video: ${payload.data.fileName}`);
    this.logger.log('Correlation ID:', payload.metadata.correlationId);

    // Simulate a long-running process
    await sleep(2000); // 2 seconds

    // Simulate a potential failure
    if (payload.data.fileName.includes('fail')) {
      this.logger.error('Transcoding failed for this video format.');
      throw new Error('Unsupported video codec');
    }

    this.logger.log('Transcoding complete.');
    return { ...payload.data, transcodedFormats: ['1080p', '720p', '480p'] };
  }
}
