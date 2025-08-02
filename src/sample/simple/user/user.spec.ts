import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { Logger } from '@nestjs/common';
import { SagaEventTestingModule } from '#/src/saga-event-module/testing/saga-event-testing.module';
import { TypedEventEmitter } from '#/src/saga-event-module/helpers/typed-event-emitter';

describe('UserModule', () => {
  let controller: UserController;
  let service: UserService;
  let eventEmitter: TypedEventEmitter;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SagaEventTestingModule],
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    module.useLogger(new Logger());

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
    eventEmitter = module.get<TypedEventEmitter>(TypedEventEmitter);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call userService.createUser and return a message', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
    };

    const initEventPromise = eventEmitter.waitFor('user.creation.init');
    const createEventPromise = eventEmitter.waitFor('user.created.success');

    await controller.createUser(createUserDto);

    const [resultInit] = await Promise.all([
      initEventPromise,
      createEventPromise,
    ]);

    expect(resultInit).toStrictEqual([
      {
        metadata: {
          eventId: expect.any(String),
          correlationId: expect.any(String),
          timestamp: expect.any(Date),
          causationId: null,
          actor: {
            type: 'system',
            id: 'system',
          },
        },
        data: [
          {
            name: 'Test User',
            email: 'test@example.com',
          },
        ],
      },
    ]);
  });

  it('should emit failure event when method returns a buffer', async () => {
    const failureEventPromise = eventEmitter.waitFor('user.buffer.failure');

    await service.methodThatReturnsBuffer();

    const [failureEvent] = await failureEventPromise;

    expect(failureEvent).toBeDefined();
    expect(failureEvent.metadata).toBeDefined();
    expect(failureEvent.data).toBeInstanceOf(Error);
    expect(failureEvent.data.message).toContain(
      "Failed to serialize event payload for UserService.methodThatReturnsBuffer. Reason: Raw Buffer found at path: 'data'. Please use a DTO with Base64 transformation.",
    );
  });
});
