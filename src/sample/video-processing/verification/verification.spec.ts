import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { vi } from 'vitest';

import { SagaEventTestingModule } from '#/src/saga-event-module/testing/saga-event-testing.module';
import { TypedEventEmitter } from '#/src/saga-event-module/helpers/typed-event-emitter';
import { VerificationService } from './verification.service';
import { VerificationFeedbackService } from './verification-feedback.service';
import { createCausationEventPayload } from '#/src/saga-event-module/testing/payload-factory';
import { JsonDatabaseService } from '#/src/database/json/json-database.service';

describe('VerificationModule', () => {
  let service: VerificationService;
  let feedbackService: VerificationFeedbackService;
  let eventEmitter: TypedEventEmitter;
  let dbService: JsonDatabaseService;

  // In-memory state to simulate the database
  let videoProcessingState: any[] = [];

  beforeAll(async () => {
    videoProcessingState = []; // Reset state before each test

    const module: TestingModule = await Test.createTestingModule({
      imports: [SagaEventTestingModule],
      providers: [
        VerificationService,
        VerificationFeedbackService,
        Logger,
        {
          provide: JsonDatabaseService,
          useValue: {
            addToCollection: vi.fn().mockImplementation((_, item) => {
              videoProcessingState.push(item);
              return Promise.resolve(undefined);
            }),
            findInCollection: vi.fn().mockImplementation((_, predicate) => {
              return Promise.resolve(videoProcessingState.filter(predicate));
            }),
            updateCollection: vi
              .fn()
              .mockImplementation((_, predicate, update) => {
                const index = videoProcessingState.findIndex(predicate);
                if (index > -1) {
                  videoProcessingState[index] = {
                    ...videoProcessingState[index],
                    ...update,
                  };
                }
                return Promise.resolve(undefined);
              }),
            deleteFromCollection: vi.fn().mockImplementation((_, predicate) => {
              videoProcessingState = videoProcessingState.filter(
                (item) => !predicate(item),
              );
              return Promise.resolve(undefined);
            }),
          },
        },
      ],
    }).compile();

    module.useLogger(new Logger());

    service = module.get<VerificationService>(VerificationService);
    feedbackService = module.get<VerificationFeedbackService>(
      VerificationFeedbackService,
    );
    eventEmitter = module.get<TypedEventEmitter>(TypedEventEmitter);
    dbService = module.get<JsonDatabaseService>(JsonDatabaseService);

    vi.clearAllMocks();
  });

  it('should define VerificationService and VerificationFeedbackService', () => {
    expect(service).toBeDefined();
    expect(feedbackService).toBeDefined();
  });

  it('should not emit event if only one of two required events is received', async () => {
    const eventDidNotFire = Symbol('eventDidNotFire');
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(eventDidNotFire), 100),
    );
    const eventPromise = eventEmitter.waitFor('video.ready.to.publish');

    const transcodedPayload = createCausationEventPayload({
      transcoded: true,
    });
    transcodedPayload.metadata.causationId = 'video.transcoded.success:1';

    await service.verifyVideoProcessing(transcodedPayload);

    const winner = await Promise.race([eventPromise, timeoutPromise]);

    expect(winner).toBe(eventDidNotFire);
  });

  it('should call logger.error on verification failure', () => {
    const loggerSpy = vi.spyOn(Logger.prototype, 'error');
    const payload = createCausationEventPayload(
      new Error('Verification failed'),
    );

    feedbackService.handleVerificationFailure(payload);

    expect(loggerSpy).toHaveBeenCalled();
  });
});
