import { Module } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublisherFeedbackService } from './publisher-feedback.service';

@Module({
  providers: [PublisherService, PublisherFeedbackService],
  exports: [PublisherService],
})
export class PublisherModule {}
