import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { vi } from 'vitest';

import { SagaEventTestingModule } from '#/src/saga-event-module/testing/saga-event-testing.module';
import { TypedEventEmitter } from '#/src/saga-event-module/helpers/typed-event-emitter';
import { PublisherService } from './publisher.service';
import { PublisherFeedbackService } from './publisher-feedback.service';
import { createCausationEventPayload } from '#/src/saga-event-module/testing/payload-factory';

describe('PublisherModule', () => {
  let service: PublisherService;
  let feedbackService: PublisherFeedbackService;
  let eventEmitter: TypedEventEmitter;
  let logger: Logger;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SagaEventTestingModule],
      providers: [PublisherService, PublisherFeedbackService, Logger],
    }).compile();

    module.useLogger(new Logger());

    service = module.get<PublisherService>(PublisherService);
    feedbackService = module.get<PublisherFeedbackService>(
      PublisherFeedbackService,
    );
    eventEmitter = module.get<TypedEventEmitter>(TypedEventEmitter);
    logger = module.get(Logger);
  });

  it('should define PublisherService and PublisherFeedbackService', () => {
    expect(service).toBeDefined();
    expect(feedbackService).toBeDefined();
  });

  it('should emit video.published.success when a video is published', async () => {
    const incomingPayload = {
      payloads: [
        { file: 'video.mp4' },
        { transcoded: true },
        { thumbnail: true },
      ],
    };
    const payload = createCausationEventPayload(incomingPayload);
    const successPromise = eventEmitter.waitFor('video.published.success');

    service.publishVideo(payload);

    const [successEvent] = await successPromise;

    expect(successEvent).toBeDefined();
    expect(successEvent.data.file).toBe('video.mp4');
    expect(successEvent.data.publishedAt).toBeDefined();
    expect(successEvent.metadata.causationId).toBe(payload.metadata.eventId);
  });

  it('should call logger.error on publishing failure', () => {
    const loggerSpy = vi.spyOn(Logger.prototype, 'error');
    const payload = createCausationEventPayload(new Error('Publishing failed'));

    feedbackService.handlePublishingFailure(payload);

    expect(loggerSpy).toHaveBeenCalled();
  });
});
