import { Module } from '@nestjs/common';
import { MermaidParserService } from './mermaid-parser.service';

@Module({
  providers: [MermaidParserService],
  exports: [MermaidParserService],
})
export class MermaidParserModule {}
