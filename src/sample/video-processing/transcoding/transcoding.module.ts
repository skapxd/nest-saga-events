import { Module } from '@nestjs/common';
import { TranscodingService } from './transcoding.service';
import { TranscodingFeedbackService } from './transcoding-feedback.service';

@Module({
  providers: [TranscodingService, TranscodingFeedbackService],
})
export class TranscodingModule {}
