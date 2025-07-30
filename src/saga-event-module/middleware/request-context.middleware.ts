import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../services/request-context.service';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}
  use(req: Request, res: Response, next: NextFunction) {
    this.contextService.run(() => {
      // Simular la obtención del actor (en una app real vendría de un token JWT)
      const actor = { id: req.headers['x-user-id'] || 'system', type: 'user' };
      this.contextService.set('actor', actor);
      this.contextService.set(
        'correlationId',
        req.headers['x-correlation-id'] || randomUUID(),
      );
      next();
    });
  }
}
