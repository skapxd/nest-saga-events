import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import {
  EmitterInfo,
  ListenerInfo,
} from '../interfaces/event-documentation.interfaces';
import {
  EMITS_EVENT_METADATA_KEY,
  EmitsEventMetadata,
} from '../decorators/emits-event.decorator';
import {
  ON_EVENT_DOC_METADATA_KEY,
  OnEventDocMetadata,
} from '../decorators/on-event-doc.decorator';

import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { join, parse } from 'path';
import { existsSync } from 'fs';
import { MermaidParserService } from '#/src/mermaid-parser/mermaid-parser.service';
import { AppEventName } from '../types';

@Injectable()
export class EventDocumentationService {
  private readonly logger = new Logger(EventDocumentationService.name);
  private flowGraphContent = 'graph TD;\n\n    Empty["No events found"];';
  private sagaStarters: EmitterInfo[] = [];

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly mermaidParser: MermaidParserService,
  ) {}

  public getFlowGraph(): string {
    return this.flowGraphContent;
  }

  public getSagaStarters(): EmitterInfo[] {
    return this.sagaStarters;
  }

  async generate(): Promise<void> {
    this.logger.log('Starting unified documentation generation...');

    // 1. Discover all elements
    const emitters = await this.discoverEmitters();
    const listeners = await this.discoverListeners();
    this.discoverSagaStarters(emitters, listeners);

    // 2. Build the graph and catalog strings
    const allEventNames = new Set<AppEventName>([
      ...emitters.map((e) => e.eventName),
      ...listeners.map((l) => l.eventName),
    ]);

    const flowGraph = this.buildFlowGraph(emitters, listeners, allEventNames);
    const catalog = this.buildCatalog(emitters, listeners, allEventNames);

    // 3. Combine into a single file
    const finalContent = `# Saga Event Documentation\n\n## Event Flow\n\n\`\`\`mermaid\n${flowGraph}\`\`\`\n\n## Event Catalog\n\n${catalog}`;

    // 4. Write the new file and clean up old ones
    const outputPath = join(
      process.cwd(),
      'docs',
      'generated',
      'SAGA_DOCUMENTATION.md',
    );
    await this.writeFileIfChanged(outputPath, finalContent);
    await this.cleanupOldFiles();

    this.logger.log('✅ Unified documentation generated successfully.');
  }

  private buildFlowGraph(
    emitters: EmitterInfo[],
    listeners: ListenerInfo[],
    allEventNames: Set<string>,
  ): string {
    this.mermaidParser.clear();

    const emitterMethodNames = new Set(
      emitters.map((e) => `${e.className}.${e.methodName}`),
    );
    const listenerMethodNames = new Set(
      listeners.map((l) => `${l.className}.${l.methodName}`),
    );

    const allMethods = new Set([...emitterMethodNames, ...listenerMethodNames]);
    for (const method of allMethods) {
      const isEmitter = emitterMethodNames.has(method);
      const isListener = listenerMethodNames.has(method);
      const type =
        isEmitter && isListener
          ? 'handler'
          : isEmitter
            ? 'emitter'
            : 'listener';
      this.mermaidParser.addNode(method, type, 'rect');
    }

    for (const eventName of allEventNames) {
      const anchor = `#${eventName.replace(/[^\w-]/gi, '').toLowerCase()}`;
      this.mermaidParser.addNode(
        eventName,
        'event',
        'stadium',
        anchor,
        `Go to ${eventName} details`,
      );
    }

    for (const emitter of emitters) {
      this.mermaidParser.addEdge(
        `${emitter.className}.${emitter.methodName}`,
        emitter.eventName,
        'Emite',
        'solid',
      );
    }

    for (const listener of listeners) {
      this.mermaidParser.addEdge(
        listener.eventName,
        `${listener.className}.${listener.methodName}`,
        'Dispara',
        'dotted',
      );
    }

    const mermaidCode = this.mermaidParser.build();
    this.flowGraphContent = mermaidCode; // Keep it for the controller endpoint
    return mermaidCode;
  }

  private buildCatalog(
    emitters: EmitterInfo[],
    listeners: ListenerInfo[],
    allEventNames: Set<string>,
  ): string {
    let catalogContent = '';
    for (const eventName of allEventNames) {
      const eventEmitters = emitters.filter((e) => e.eventName === eventName);
      const eventListeners = listeners.filter((l) => l.eventName === eventName);
      const description =
        eventEmitters[0]?.description || 'No description provided.';

      catalogContent += `### \`${eventName}\`\n\n`;
      catalogContent += `**Description**: ${description}\n\n`;

      if (eventEmitters.length > 0) {
        catalogContent += `**Emitted By**:\n`;
        catalogContent += eventEmitters
          .map((e) => `- \`${e.className}.${e.methodName}\``)
          .join('\n');
        catalogContent += '\n\n';
      }

      if (eventListeners.length > 0) {
        catalogContent += `**Listened By**:\n`;
        catalogContent += eventListeners
          .map((l) => `- \`${l.className}.${l.methodName}\``)
          .join('\n');
        catalogContent += '\n\n';
      }
      catalogContent += '---\n';
    }
    return catalogContent;
  }

  private discoverSagaStarters(
    emitters: EmitterInfo[],
    listeners: ListenerInfo[],
  ) {
    const listenerMethodIds = new Set(
      listeners.map((l) => `${l.className}.${l.methodName}`),
    );
    const starterMethods = new Map<string, EmitterInfo>();
    for (const emitter of emitters) {
      const emitterMethodId = `${emitter.className}.${emitter.methodName}`;
      if (
        !listenerMethodIds.has(emitterMethodId) &&
        emitter.eventName.endsWith('.init')
      ) {
        starterMethods.set(emitterMethodId, emitter);
      }
    }
    this.sagaStarters = Array.from(starterMethods.values());
  }

  private async discoverEmitters(): Promise<EmitterInfo[]> {
    const providers = await this.discoveryService.providersWithMetaAtKey<
      EmitsEventMetadata[]
    >(EMITS_EVENT_METADATA_KEY);
    return providers.flatMap((p) =>
      p.meta.flatMap((m) => {
        const base = {
          className: m.className,
          methodName: m.methodName,
        };
        const events = [];
        if (m.onInit)
          events.push({
            ...base,
            eventName: m.onInit.name,
            description: m.onInit.description || '',
          });
        if (m.onSuccess)
          events.push({
            ...base,
            eventName: m.onSuccess.name,
            description: m.onSuccess.description || '',
          });
        if (m.onFailure)
          events.push({
            ...base,
            eventName: m.onFailure.name,
            description: m.onFailure.description || '',
          });
        return events;
      }),
    );
  }

  private async discoverListeners(): Promise<ListenerInfo[]> {
    const providers = await this.discoveryService.providersWithMetaAtKey<
      OnEventDocMetadata[]
    >(ON_EVENT_DOC_METADATA_KEY);

    return providers.flatMap((provider) =>
      provider.meta.flatMap((metadata) => {
        const { eventName, ...rest } = metadata;
        if (Array.isArray(eventName)) {
          return eventName.map((e) => ({ ...rest, eventName: e }));
        }
        return [{ ...rest, eventName }];
      }),
    );
  }

  private async writeFileIfChanged(path: string, content: string) {
    const dir = parse(path).dir;
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    if (existsSync(path)) {
      const existingContent = await readFile(path, 'utf-8');
      if (existingContent === content) {
        this.logger.log(`No changes for ${parse(path).base}. Skipping write.`);
        return;
      }
    }
    await writeFile(path, content);
    this.logger.log(`Documentation file ${parse(path).base} written.`);
  }

  private async cleanupOldFiles() {
    const oldFiles = ['EVENT_CATALOG.md', 'EVENT_FLOW.md'].map((f) =>
      join(process.cwd(), 'docs', 'generated', f),
    );
    for (const file of oldFiles) {
      if (existsSync(file)) {
        await rm(file);
        this.logger.log(`Removed old documentation file: ${parse(file).base}`);
      }
    }
  }
}
