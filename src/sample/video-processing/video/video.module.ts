import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { VideoFeedbackService } from './video-feedback.service';

@Module({
  controllers: [VideoController],
  providers: [VideoService, VideoFeedbackService],
  exports: [VideoService],
})
export class VideoModule {}
