import { Module } from '@nestjs/common';
import { ThumbnailService } from './thumbnail.service';

@Module({
  providers: [ThumbnailService],
})
export class ThumbnailModule {}
