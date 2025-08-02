import { Injectable, Logger } from '@nestjs/common';
import { EmitsEvent } from '../../../saga-event-module/decorators/emits-event.decorator';
import { CreateUserDto } from './user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  @EmitsEvent({
    onInit: { name: 'user.creation.init' },
    onSuccess: {
      name: 'user.created.success',
    },
    onFailure: { name: 'user.created.failure' },
  })
  async createUser(createUserDto: CreateUserDto) {
    this.logger.log('Attempting to create user:', createUserDto);

    // Simulate a process that can fail
    if (Math.random() < 0.5) {
      throw new Error('Random failure during user creation');
    }

    const user = { id: '12345', ...createUserDto };
    this.logger.log('User created in service:', user);
    return user;
  }

  @EmitsEvent({
    onSuccess: { name: 'user.buffer.success' },
    onFailure: { name: 'user.buffer.failure' },
  })
  async methodThatReturnsBuffer() {
    return Buffer.from('this is a test buffer');
  }
}
