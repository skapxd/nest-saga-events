import { Injectable, Logger } from '@nestjs/common';
import { EmitsEvent } from '#/src/saga-event-module/decorators/emits-event.decorator';
import { UploadVideoDto } from './dto/upload-video.dto';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  @EmitsEvent({
    onSuccess: {
      name: 'video.uploaded',
      description: 'Fired when a video is uploaded and ready for processing.',
    },
    onFailure: {
      name: 'video.upload.failed',
      description: 'Fired if the initial video upload processing fails.',
    },
  })
  processUploadedVideo(uploadVideoDto: UploadVideoDto) {
    this.logger.log('--- Video Service: Starting Saga ---');
    this.logger.log('Received video upload:', uploadVideoDto);
    // In a real app, this might involve moving the file from a temp location
    // and creating a 'PENDING' record in the database.
    // The decorator will emit 'video.uploaded' with this DTO as the payload.
    return uploadVideoDto;
  }
}
