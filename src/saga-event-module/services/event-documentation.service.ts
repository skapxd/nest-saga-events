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
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, parse } from 'path';
import { existsSync } from 'fs';

import {
  DEPENDS_ON_EVENT_METADATA_KEY,
  DependsOnEventMetadata,
} from '../decorators/depends-on-event.decorator';

@Injectable()
export class EventDocumentationService {
  private readonly logger = new Logger(EventDocumentationService.name);
  private flowGraphContent = 'graph TD;\n\n    Empty["No events found"];';
  private sagaStarters: EmitterInfo[] = [];

  constructor(private readonly discoveryService: DiscoveryService) {}

  public getFlowGraph(): string {
    return this.flowGraphContent;
  }

  public getSagaStarters(): EmitterInfo[] {
    return this.sagaStarters;
  }

  async generate(): Promise<void> {
    this.logger.log('Starting event documentation generation...');

    const emitters = await this.discoverEmitters();
    const listeners = await this.discoverListeners();

    this.discoverSagaStarters(emitters, listeners);
    await this.generateCatalog(emitters, listeners);
    await this.generateFlowGraph(emitters, listeners);

    this.logger.log('✅ Event documentation generated successfully.');
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
      // A method is a starter if it emits events but is NOT triggered by one.
      if (!listenerMethodIds.has(emitterMethodId)) {
        // We only care about the 'onInit' event for the starter list
        if (emitter.eventName.endsWith('.init')) {
          starterMethods.set(emitterMethodId, emitter);
        }
      }
    }

    this.sagaStarters = Array.from(starterMethods.values());
    this.logger.log(`Discovered ${this.sagaStarters.length} saga starter(s).`);
  }

  private async discoverEmitters(): Promise<EmitterInfo[]> {
    const providers = await this.discoveryService.providersWithMetaAtKey<
      EmitsEventMetadata[]
    >(EMITS_EVENT_METADATA_KEY);
    const emitters: EmitterInfo[] = [];

    for (const provider of providers) {
      const metadataList = provider.meta;
      for (const metadata of metadataList) {
        if (metadata.onInit) {
          emitters.push({
            eventName: metadata.onInit.name,
            className: metadata.className,
            methodName: metadata.methodName,
            description:
              metadata.onInit.description || 'Fired when the operation starts.',
          });
        }
        if (metadata.onSuccess) {
          emitters.push({
            eventName: metadata.onSuccess.name,
            className: metadata.className,
            methodName: metadata.methodName,
            description:
              metadata.onSuccess.description ||
              'Fired on successful execution.',
          });
        }
        if (metadata.onFailure) {
          emitters.push({
            eventName: metadata.onFailure.name,
            className: metadata.className,
            methodName: metadata.methodName,
            description:
              metadata.onFailure.description || 'Fired on failed execution.',
          });
        }
      }
    }
    return emitters;
  }

  private async discoverListeners(): Promise<ListenerInfo[]> {
    const listeners: ListenerInfo[] = [];

    // Discover actual event listeners from @OnEventDoc
    const onEventProviders = await this.discoveryService.providersWithMetaAtKey<
      OnEventDocMetadata[]
    >(ON_EVENT_DOC_METADATA_KEY);

    for (const provider of onEventProviders) {
      const metadataList = provider.meta;
      for (const metadata of metadataList) {
        listeners.push({
          eventName: metadata.eventName,
          className: metadata.className,
          methodName: metadata.methodName,
        });
      }
    }

    // Discover logical dependencies from @DependsOnEvent
    const dependsOnProviders =
      await this.discoveryService.providersWithMetaAtKey<
        DependsOnEventMetadata[]
      >(DEPENDS_ON_EVENT_METADATA_KEY);

    for (const provider of dependsOnProviders) {
      const metadataList = provider.meta;
      for (const metadata of metadataList) {
        listeners.push({
          eventName: metadata.eventName,
          className: metadata.className,
          methodName: metadata.methodName,
        });
      }
    }

    return listeners;
  }

  private async generateCatalog(
    emitters: EmitterInfo[],
    listeners: ListenerInfo[],
  ) {
    let content = '# Event Catalog\n\n';
    content +=
      'This document is auto-generated by the `EventDocumentationService`. Do not edit manually.\n\n';
    content += '| Event Name | Description | Emitted By | Listened By |\n';
    content += '|------------|-------------|------------|-------------|\n';

    const allEventNames = new Set([
      ...emitters.map((e) => e.eventName),
      ...listeners.map((l) => l.eventName),
    ]);

    for (const eventName of allEventNames) {
      const eventEmitters = emitters.filter((e) => e.eventName === eventName);
      const eventListeners = listeners.filter((l) => l.eventName === eventName);

      const description = eventEmitters[0]?.description || 'N/A';
      const emitterStr =
        eventEmitters
          .map((e) => `\`${e.className}.${e.methodName}\``)
          .join('<br/>') || 'N/A';
      const listenerStr =
        eventListeners
          .map((l) => `\`${l.className}.${l.methodName}\``)
          .join('<br/>') || 'N/A';

      content += `| \`${eventName}\` | ${description} | ${emitterStr} | ${listenerStr} |\n`;
    }

    const outputPath = join(
      process.cwd(),
      'docs',
      'generated',
      'EVENT_CATALOG.md',
    );
    await this.writeFileIfChanged(outputPath, content);
  }

  private async generateFlowGraph(
    emitters: EmitterInfo[],
    listeners: ListenerInfo[],
  ) {
    let mermaidCode = 'graph TD;\n\n';

    // --- Style Definitions ---
    mermaidCode += `    classDef emitterStyle fill:#d4edda,stroke:#c3e6cb,color:#155724\n`;
    mermaidCode += `    classDef handlerStyle fill:#d1ecf1,stroke:#bee5eb,color:#0c5460\n`;
    mermaidCode += `    classDef listenerStyle fill:#fff3cd,stroke:#ffeeba,color:#856404\n`;
    mermaidCode += `    classDef eventStyle fill:#f8d7da,stroke:#f5c6cb,color:#721c24,stroke-width:2px,font-weight:bold\n\n`;

    const nodes = new Map<string, string>();
    let i = 0;
    const getNodeId = (name: string) => {
      if (!nodes.has(name)) {
        const cleanName = name.replace(/[^\w\s.-]/gi, '_');
        nodes.set(name, `N${i++}_${cleanName}`);
      }
      return nodes.get(name);
    };

    const emitterMethodNames = new Set(
      emitters.map((e) => `${e.className}.${e.methodName}`),
    );
    const listenerMethodNames = new Set(
      listeners.map((l) => `${l.className}.${l.methodName}`),
    );

    const allMethods = new Set([...emitterMethodNames, ...listenerMethodNames]);
    const allEventNames = new Set([
      ...emitters.map((e) => e.eventName),
      ...listeners.map((l) => l.eventName),
    ]);

    const emitterNodeIds: string[] = [];
    const handlerNodeIds: string[] = [];
    const listenerNodeIds: string[] = [];
    const eventNodeIds: string[] = [];

    // --- Node Definitions ---
    for (const method of allMethods) {
      const nodeId = getNodeId(method);
      if (!nodeId) continue;

      mermaidCode += `    ${nodeId}["${method}"]\n`;
      const isEmitter = emitterMethodNames.has(method);
      const isListener = listenerMethodNames.has(method);

      if (isEmitter && isListener) {
        handlerNodeIds.push(nodeId);
      } else if (isEmitter) {
        emitterNodeIds.push(nodeId);
      } else if (isListener) {
        listenerNodeIds.push(nodeId);
      }
    }

    for (const eventName of allEventNames) {
      const nodeId = getNodeId(eventName);
      if (!nodeId) continue;
      // Use stadium shape for events
      mermaidCode += `    ${nodeId}(["${eventName}"])\n`;
      eventNodeIds.push(nodeId);
    }
    mermaidCode += '\n';

    // --- Edge Definitions ---
    for (const emitter of emitters) {
      const emitterNode = `${emitter.className}.${emitter.methodName}`;
      mermaidCode += `    ${getNodeId(emitterNode)} -- Emits --> ${getNodeId(
        emitter.eventName,
      )}\n`;
    }
    for (const listener of listeners) {
      const listenerNode = `${listener.className}.${listener.methodName}`;
      mermaidCode += `    ${getNodeId(
        listener.eventName,
      )} -. Triggers .-> ${getNodeId(listenerNode)}\n`;
    }
    mermaidCode += '\n';

    // --- Style Assignments ---
    if (emitterNodeIds.length > 0) {
      mermaidCode += `    class ${emitterNodeIds.join(',')} emitterStyle\n`;
    }
    if (handlerNodeIds.length > 0) {
      mermaidCode += `    class ${handlerNodeIds.join(',')} handlerStyle\n`;
    }
    if (listenerNodeIds.length > 0) {
      mermaidCode += `    class ${listenerNodeIds.join(',')} listenerStyle\n`;
    }
    if (eventNodeIds.length > 0) {
      mermaidCode += `    class ${eventNodeIds.join(',')} eventStyle\n`;
    }

    // Store raw mermaid code for the controller
    this.flowGraphContent = mermaidCode;

    // Construct full markdown for the file
    const fileContent = `# Event Flow Graph\n\nThis document is auto-generated by the \`EventDocumentationService\`. Do not edit manually.\n\n\`\`\`mermaid\n${mermaidCode}\`\`\`\n`;

    const outputPath = join(
      process.cwd(),
      'docs',
      'generated',
      'EVENT_FLOW.md',
    );
    await this.writeFileIfChanged(outputPath, fileContent);
  }

  private async writeFileIfChanged(path: string, content: string) {
    const dir = parse(path).dir;
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

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
}
