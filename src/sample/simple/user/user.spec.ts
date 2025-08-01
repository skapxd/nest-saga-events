import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { SagaEventTestingModule } from '#/src/saga-event-module/testing/saga-event-testing.module';

describe('UserModule', () => {
  describe('UserController', () => {
    let controller: UserController;
    let service: UserService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [SagaEventTestingModule],
        controllers: [UserController],
        providers: [UserService],
      }).compile();
      module.useLogger(new Logger());
      controller = module.get<UserController>(UserController);
      service = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    describe('createUser', () => {
      it('should call userService.createUser and return a message', async () => {
        const createUserDto: CreateUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };
        const spy = vi.spyOn(service, 'createUser');
        const result = await controller.createUser(createUserDto);

        expect(spy).toHaveBeenCalledWith(createUserDto);
        expect(result).toEqual({
          message: 'User creation process started.',
        });
      });
    });
  });

  describe('UserService', () => {
    let service: UserService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [SagaEventTestingModule],
        providers: [UserService],
      }).compile();

      service = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('createUser', () => {
      it('should create a user successfully', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.6); // Should not fail
        const createUserDto: CreateUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };
        const result = await service.createUser(createUserDto);
        expect(result).toEqual({ id: '12345', ...createUserDto });
      });

      it('should handle an error during user creation', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.4); // Should fail
        const createUserDto: CreateUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };
        const result = await service.createUser(createUserDto);
        expect(result).toBeUndefined();
      });
    });
  });
});
