import {
  Controller,
  Get,
  Header,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { EventDocumentationService } from '../services/event-documentation.service';
import { JsonDatabaseService } from '#/database/json/json-database.service';
import { EventPayload } from '../interfaces/event.interfaces';

@Controller('event-docs')
export class EventDocumentationController {
  constructor(
    private readonly eventDocumentationService: EventDocumentationService,
    private readonly dbService: JsonDatabaseService,
  ) {}

  @Get('flow')
  @Header('Content-Type', 'text/plain')
  getFlowDiagram(): string {
    return this.eventDocumentationService.getFlowGraph();
  }

  @Get('saga/:correlationId')
  async getSagaByCorrelationId(@Param('correlationId') correlationId: string) {
    const sagaEvents = await this.dbService.findInCollection<EventPayload<any>>(
      'events',
      (event: EventPayload<any>) =>
        event.metadata.correlationId === correlationId,
    );

    if (!sagaEvents || sagaEvents.length === 0) {
      throw new NotFoundException(
        `Saga with correlationId '${correlationId}' not found.`,
      );
    }

    // Sort events by timestamp to see the flow
    return sagaEvents.sort(
      (a: EventPayload<any>, b: EventPayload<any>) =>
        new Date(a.metadata.timestamp).getTime() -
        new Date(b.metadata.timestamp).getTime(),
    );
  }
}
