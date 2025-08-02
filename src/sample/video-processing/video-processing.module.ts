import { Module } from '@nestjs/common';
import { VideoModule } from './video/video.module';
import { TranscodingModule } from './transcoding/transcoding.module';
import { ThumbnailModule } from './thumbnail/thumbnail.module';
import { VerificationModule } from './verification/verification.module';
import { PublisherModule } from './publisher/publisher.module';

@Module({
  imports: [
    VideoModule,
    TranscodingModule,
    ThumbnailModule,
    VerificationModule,
    PublisherModule,
  ],
})
export class VideoProcessingModule {}
