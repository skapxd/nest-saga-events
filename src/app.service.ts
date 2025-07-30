import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AppService {
  constructor(public readonly eventEmitter: EventEmitter2) {}

  getHello(): string {
    return 'Hello World!';
  }
}
