import { Module } from '@nestjs/common';
import { ThumbnailService } from './thumbnail.service';
import { ThumbnailFeedbackService } from './thumbnail-feedback.service';

@Module({
  providers: [ThumbnailService, ThumbnailFeedbackService],
})
export class ThumbnailModule {}
