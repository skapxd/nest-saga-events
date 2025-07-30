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

import { EmitterInfo } from '../interfaces/event-documentation.interfaces';

// The type of the object stored in the database
type LoggedEvent = EventPayload<any> & { eventName: string };

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

  @Get('sagas')
  getAvailableSagas(): EmitterInfo[] {
    return this.eventDocumentationService.getSagaStarters();
  }

  @Get('sagas/executed')
  async getExecutedSagas() {
    const startingEvents = await this.dbService.findInCollection<LoggedEvent>(
      'events',
      (event) => event.metadata.causationId === null,
    );

    // Group by saga name (e.g., 'user.creation.init') and count instances
    const sagas = startingEvents.reduce(
      (acc, event) => {
        const sagaName = event.eventName;
        if (!acc[sagaName]) {
          acc[sagaName] = {
            name: sagaName,
            instances: [],
          };
        }
        acc[sagaName].instances.push({
          correlationId: event.metadata.correlationId,
          startedAt: event.metadata.timestamp,
          actor: event.metadata.actor,
        });
        return acc;
      },
      {} as Record<
        string,
        {
          name: string;
          instances: {
            correlationId: string;
            startedAt: Date;
            actor: any;
          }[];
        }
      >,
    );

    return Object.values(sagas);
  }

  @Get('saga/:correlationId')
  async getSagaByCorrelationId(
    @Param('correlationId') correlationId: string,
  ): Promise<LoggedEvent[]> {
    const sagaEvents = await this.dbService.findInCollection<LoggedEvent>(
      'events',
      (event) => event.metadata.correlationId === correlationId,
    );

    if (!sagaEvents || sagaEvents.length === 0) {
      throw new NotFoundException(
        `Saga with correlationId '${correlationId}' not found.`,
      );
    }

    // Sort events by timestamp to see the flow
    return sagaEvents.sort(
      (a, b) =>
        new Date(a.metadata.timestamp).getTime() -
        new Date(b.metadata.timestamp).getTime(),
    );
  }
}
