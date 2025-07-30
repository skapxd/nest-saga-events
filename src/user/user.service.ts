// src/user/user.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EmitsEvent } from '../saga-event-module/decorators/emits-event.decorator';
import { CreateUserDto } from './user.dto';
import { EventMetadataHelper } from '../saga-event-module/services/event-metadata.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    public readonly eventEmitter: EventEmitter2,
    public readonly eventMetadataHelper: EventMetadataHelper,
  ) {}

  @EmitsEvent({
    onSuccess: { name: 'user.created.success' },
    onFailure: { name: 'user.created.failure' },
  })
  createUser(createUserDto: CreateUserDto) {
    this.logger.log('Attempting to create user:', createUserDto);

    // Simulate a process that can fail
    if (Math.random() < 0.5) {
      throw new Error('Random failure during user creation');
    }

    const user = { id: '12345', ...createUserDto };
    this.logger.log('User created in service:', user);
    return user;
  }
}
