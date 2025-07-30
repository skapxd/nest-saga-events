import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AUDIT_METHOD_ERROR,
  AUDIT_METHOD_START,
  AUDIT_METHOD_SUCCESS,
} from './audit.decorator';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  @OnEvent(AUDIT_METHOD_START, { async: true })
  handleMethodStart(payload: {
    className: string;
    methodName: string;
    args: any[];
  }) {
    this.logger.log(
      `[${payload.className}] Method '${payload.methodName}' started with args: ${JSON.stringify(
        payload.args,
      )}`,
    );
  }

  @OnEvent(AUDIT_METHOD_SUCCESS, { async: true })
  handleMethodSuccess(payload: {
    className: string;
    methodName: string;
    result: any;
  }) {
    this.logger.log(
      `[${payload.className}] Method '${
        payload.methodName
      }' executed successfully. Result: ${JSON.stringify(payload.result)}`,
    );
  }

  @OnEvent(AUDIT_METHOD_ERROR, { async: true })
  handleMethodError(payload: {
    className: string;
    methodName: string;
    error: Error;
  }) {
    this.logger.error(
      `[${payload.className}] Method '${payload.methodName}' failed with error: ${payload.error.message}`,
    );
  }
}
