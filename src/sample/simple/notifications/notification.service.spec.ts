import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { vi } from 'vitest';

import { SagaEventTestingModule } from '#/src/saga-event-module/testing/saga-event-testing.module';
import { NotificationService } from './notification.service';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';

describe('NotificationService', () => {
  let service: NotificationService;
  let logger: Logger;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SagaEventTestingModule],
      providers: [NotificationService, Logger],
    }).compile();

    module.useLogger(new Logger());

    service = module.get<NotificationService>(NotificationService);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the log method when handling user.created.success', () => {
    const loggerSpy = vi.spyOn(Logger.prototype, 'log');
    const payload: EventPayload<{ id: string; name: string; email: string }> = {
      metadata: {
        eventId: 'test-event-id',
        correlationId: 'test-correlation-id',
        causationId: 'test-causation-id',
        timestamp: new Date(),
        actor: { type: 'user', id: 'test-user' },
      },
      data: {
        id: '123',
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
    };

    service.handleUserCreatedSuccess(payload);

    expect(loggerSpy).toHaveBeenCalled();
  });

  it('should call the log method when handling user.created.failure', () => {
    const loggerSpy = vi.spyOn(Logger.prototype, 'log');
    const payload: EventPayload<Error> = {
      metadata: {
        eventId: 'test-event-id',
        correlationId: 'test-correlation-id',
        causationId: 'test-causation-id',
        timestamp: new Date(),
        actor: { type: 'system', id: 'test-system' },
      },
      data: new Error('User creation failed'),
    };

    service.handleUserCreatedFailure(payload);

    expect(loggerSpy).toHaveBeenCalled();
  });
});
