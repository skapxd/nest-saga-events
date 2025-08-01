import { Module } from '@nestjs/common';
import { VideoModule } from './video/video.module';
import { TranscodingModule } from './transcoding/transcoding.module';
import { ThumbnailModule } from './thumbnail/thumbnail.module';
import { PublishingModule } from './publishing/publishing.module';

@Module({
  imports: [VideoModule, TranscodingModule, ThumbnailModule, PublishingModule],
})
export class VideoProcessingModule {}
