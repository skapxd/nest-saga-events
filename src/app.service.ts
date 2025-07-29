import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditMethod } from './audit/audit.decorator';

@Injectable()
export class AppService {
  constructor(public readonly eventEmitter: EventEmitter2) {}

  getHello(): string {
    return 'Hello World!';
  }

  @AuditMethod()
  async getSuccess(name: string): Promise<string> {
    // Simulate some async work
    await new Promise((resolve) => setTimeout(resolve, 50));
    return `Hello, ${name}! This was a success.`;
  }

  @AuditMethod()
  async getError(): Promise<void> {
    // Simulate some async work
    await new Promise((resolve) => setTimeout(resolve, 50));
    throw new InternalServerErrorException('This is a simulated error.');
  }
}
