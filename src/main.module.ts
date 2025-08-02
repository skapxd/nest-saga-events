import { Module } from '@nestjs/common';
import { SagaEventModule } from './saga-event-module/saga-event.module';
import { SimpleModule } from './sample/simple/simple.module';
import { DatabaseModule } from './database/database.module';
import { VideoProcessingModule } from './sample/video-processing/video-processing.module';

@Module({
  imports: [
    DatabaseModule,
    SagaEventModule,
    SimpleModule,
    VideoProcessingModule,
  ],
})
export class AppModule {}
