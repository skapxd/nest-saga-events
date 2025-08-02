import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { vi } from 'vitest';

import { SagaEventTestingModule } from '#/src/saga-event-module/testing/saga-event-testing.module';
import { TypedEventEmitter } from '#/src/saga-event-module/helpers/typed-event-emitter';
import { ThumbnailService } from './thumbnail.service';
import { ThumbnailFeedbackService } from './thumbnail-feedback.service';
import { UploadVideoDto } from '../video/dto/upload-video.dto';
import { createCausationEventPayload } from '#/src/saga-event-module/testing/payload-factory';

describe('ThumbnailModule', () => {
  let service: ThumbnailService;
  let feedbackService: ThumbnailFeedbackService;
  let eventEmitter: TypedEventEmitter;
  let logger: Logger;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SagaEventTestingModule],
      providers: [ThumbnailService, ThumbnailFeedbackService, Logger],
    }).compile();

    module.useLogger(new Logger());

    service = module.get<ThumbnailService>(ThumbnailService);
    feedbackService = module.get<ThumbnailFeedbackService>(
      ThumbnailFeedbackService,
    );
    eventEmitter = module.get<TypedEventEmitter>(TypedEventEmitter);
    logger = module.get(Logger);
  });

  it('should define ThumbnailService and ThumbnailFeedbackService', () => {
    expect(service).toBeDefined();
    expect(feedbackService).toBeDefined();
  });

  it('should emit thumbnail.generated.success on successful generation', async () => {
    const uploadDto: UploadVideoDto = {
      userId: 'user-1',
      fileName: 'video.mp4',
      path: '/uploads/video.mp4',
    };
    const payload = createCausationEventPayload(uploadDto);
    const successPromise = eventEmitter.waitFor('thumbnail.generated.success');

    service.handleVideoUploaded(payload);

    const [successEvent] = await successPromise;

    expect(successEvent).toBeDefined();
    expect(successEvent.data.thumbnailPath).toBe('/uploads/video_thumb.jpg');
    expect(successEvent.metadata.correlationId).toBe(
      payload.metadata.correlationId,
    );
    expect(successEvent.metadata.causationId).toBe(payload.metadata.eventId);
  });

  it('should call logger.error on thumbnail generation failure', () => {
    const loggerSpy = vi.spyOn(Logger.prototype, 'error');
    const payload = createCausationEventPayload(new Error('Generation failed'));

    feedbackService.handleThumbnailFailure(payload);

    expect(loggerSpy).toHaveBeenCalled();
  });
});
