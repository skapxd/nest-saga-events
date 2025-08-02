import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { vi } from 'vitest';

import { SagaEventTestingModule } from '#/src/saga-event-module/testing/saga-event-testing.module';
import { TypedEventEmitter } from '#/src/saga-event-module/helpers/typed-event-emitter';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { VideoFeedbackService } from './video-feedback.service';
import { UploadVideoDto } from './dto/upload-video.dto';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';

let controller: VideoController;
let service: VideoService;
let feedbackService: VideoFeedbackService;
let eventEmitter: TypedEventEmitter;
let logger: Logger;

beforeAll(async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [SagaEventTestingModule],
    controllers: [VideoController],
    providers: [VideoService, VideoFeedbackService, Logger],
  }).compile();

  module.useLogger(new Logger());

  controller = module.get<VideoController>(VideoController);
  service = module.get<VideoService>(VideoService);
  feedbackService = module.get<VideoFeedbackService>(VideoFeedbackService);
  eventEmitter = module.get<TypedEventEmitter>(TypedEventEmitter);
  logger = module.get(Logger);
});

describe('VideoController', () => {
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should trigger the video processing and return a confirmation message', () => {
    const uploadVideoDto: UploadVideoDto = {
      userId: 'user-1',
      fileName: 'test-video.mp4',
      path: '/uploads/test-video.mp4',
    };
    const serviceSpy = vi.spyOn(service, 'processUploadedVideo');
    const result = controller.uploadVideo(uploadVideoDto);

    expect(serviceSpy).toHaveBeenCalledWith(uploadVideoDto);
    expect(result).toEqual({ message: 'Video processing started.' });
  });
});

describe('VideoService', () => {
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should emit video.uploaded on successful processing', async () => {
    const uploadVideoDto: UploadVideoDto = {
      userId: 'user-1',
      fileName: 'test-video.mp4',
      path: '/uploads/test-video.mp4',
    };
    const successPromise = eventEmitter.waitFor('video.uploaded');

    service.processUploadedVideo(uploadVideoDto);

    const [successEvent] = await successPromise;

    expect(successEvent).toBeDefined();
    expect(successEvent.data).toEqual(uploadVideoDto);
    expect(successEvent.metadata.causationId).toBeNull();
  });
});

describe('VideoFeedbackService', () => {
  it('should be defined', () => {
    expect(feedbackService).toBeDefined();
  });

  it('should call logger.error on upload failure', () => {
    const loggerSpy = vi.spyOn(Logger.prototype, 'error');
    const payload: EventPayload<Error> = {
      metadata: {
        eventId: 'test-event-id',
        correlationId: 'test-correlation-id',
        causationId: 'test-causation-id',
        timestamp: new Date(),
        actor: { type: 'system', id: 'test-system' },
      },
      data: new Error('Upload failed'),
    };

    feedbackService.handleUploadFailure(payload);

    expect(loggerSpy).toHaveBeenCalled();
  });
});
