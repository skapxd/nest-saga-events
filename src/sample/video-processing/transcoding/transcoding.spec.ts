import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { vi } from 'vitest';

import { SagaEventTestingModule } from '#/src/saga-event-module/testing/saga-event-testing.module';
import { TypedEventEmitter } from '#/src/saga-event-module/helpers/typed-event-emitter';
import { TranscodingService } from './transcoding.service';
import { TranscodingFeedbackService } from './transcoding-feedback.service';
import { UploadVideoDto } from '../video/dto/upload-video.dto';
import { createCausationEventPayload } from '#/src/saga-event-module/testing/payload-factory';

let service: TranscodingService;
let feedbackService: TranscodingFeedbackService;
let eventEmitter: TypedEventEmitter;
let logger: Logger;

beforeAll(async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [SagaEventTestingModule],
    providers: [TranscodingService, TranscodingFeedbackService, Logger],
  }).compile();

  module.useLogger(new Logger());

  service = module.get<TranscodingService>(TranscodingService);
  feedbackService = module.get<TranscodingFeedbackService>(
    TranscodingFeedbackService,
  );
  eventEmitter = module.get<TypedEventEmitter>(TypedEventEmitter);
  logger = module.get(Logger);
});

describe('TranscodingService', () => {
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should emit video.transcoded.success on successful transcoding', async () => {
    const uploadDto: UploadVideoDto = {
      userId: 'user-1',
      fileName: 'success.mp4',
      path: '/vids/success.mp4',
    };
    const payload = createCausationEventPayload(uploadDto);
    const successPromise = eventEmitter.waitFor('video.transcoded.success');

    await service.handleVideoUploaded(payload);

    const [successEvent] = await successPromise;

    expect(successEvent).toBeDefined();
    expect(successEvent.data.transcodedFormats).toEqual([
      '1080p',
      '720p',
      '480p',
    ]);
    expect(successEvent.metadata.correlationId).toBe(
      payload.metadata.correlationId,
    );
    expect(successEvent.metadata.causationId).toBe(payload.metadata.eventId);
  });

  it('should emit video.transcoded.failure when transcoding fails', async () => {
    const uploadDto: UploadVideoDto = {
      userId: 'user-1',
      fileName: 'fail.mp4',
      path: '/vids/fail.mp4',
    };
    const payload = createCausationEventPayload(uploadDto);
    const failurePromise = eventEmitter.waitFor('video.transcoded.failure');

    await service.handleVideoUploaded(payload);

    const [failureEvent] = await failurePromise;

    expect(failureEvent).toBeDefined();
    expect(failureEvent.data).toBeInstanceOf(Error);
    expect(failureEvent.data.message).toBe('Unsupported video codec');
    expect(failureEvent.metadata.correlationId).toBe(
      payload.metadata.correlationId,
    );
  });
});

describe('TranscodingFeedbackService', () => {
  it('should be defined', () => {
    expect(feedbackService).toBeDefined();
  });

  it('should call logger.error on transcoding failure', () => {
    const loggerSpy = vi.spyOn(Logger.prototype, 'error');
    const payload = createCausationEventPayload(new Error('Codec error'));

    feedbackService.handleTranscodingFailure(payload);

    expect(loggerSpy).toHaveBeenCalled();
  });
});
