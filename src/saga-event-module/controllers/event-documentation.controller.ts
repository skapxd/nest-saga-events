import { Controller, Get, Header } from '@nestjs/common';
import { EventDocumentationService } from '../services/event-documentation.service';

@Controller('event-docs')
export class EventDocumentationController {
  constructor(
    private readonly eventDocumentationService: EventDocumentationService,
  ) {}

  @Get('flow')
  @Header('Content-Type', 'text/plain')
  getFlowDiagram(): string {
    return this.eventDocumentationService.getFlowGraph();
  }
}
