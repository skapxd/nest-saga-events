import { Module } from '@nestjs/common';
import { TranscodingService } from './transcoding.service';

@Module({
  providers: [TranscodingService],
})
export class TranscodingModule {}
