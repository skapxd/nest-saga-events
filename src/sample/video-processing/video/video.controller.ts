import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { VideoService } from './video.service';
import { UploadVideoDto } from './dto/upload-video.dto';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  @HttpCode(202) // Accepted
  uploadVideo(@Body() uploadVideoDto: UploadVideoDto) {
    this.videoService.processUploadedVideo(uploadVideoDto);
    return { message: 'Video processing started.' };
  }
}
