import { Command, CommandRunner, InquirerService } from 'nest-commander';
import { SagaRegistryService } from '../services/saga-registry.service';
import { writeFile } from 'fs/promises';

@Command({ name: 'generate-docs', description: 'Generate event documentation' })
export class GenerateDocsCommand extends CommandRunner {
  constructor(
    private readonly inquirer: InquirerService,
    private readonly sagaRegistryService: SagaRegistryService,
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(_inputs: string[], _options: Record<string, any>): Promise<void> {
    const emitters = this.sagaRegistryService.emitters;
    const listeners = this.sagaRegistryService.listeners;

    // Generate generated-events.ts
    const eventNames = Array.from(
      new Set([...emitters.keys(), ...listeners.keys()]),
    );
    const generatedEventsContent = `export const EventNames = ${JSON.stringify(
      eventNames,
      null,
      2,
    )};\n`;
    await writeFile('generated-events.ts', generatedEventsContent);

    // Generate EVENT_CATALOG.md
    let eventCatalogContent = '# Event Catalog\n\n';
    eventCatalogContent += '| Event Name | Emitter | Listener(s) |\n';
    eventCatalogContent += '|------------|---------|-------------|\n';
    for (const eventName of eventNames) {
      const emitterInfo = emitters.get(eventName);
      const listenerInfo = listeners.get(eventName) || [];
      eventCatalogContent += `| ${eventName} | ${
        emitterInfo ? `${emitterInfo.className}.${emitterInfo.methodName}` : ''
      } | ${listenerInfo
        .map((l) => `${l.className}.${l.methodName}`)
        .join(', ')} |\n`;
    }
    await writeFile('EVENT_CATALOG.md', eventCatalogContent);

    // Generate EVENT_FLOW.md (Mermaid.js)
    let eventFlowContent = '```mermaid\ngraph LR;\n';
    for (const [eventName, emitterInfo] of emitters.entries()) {
      const listenerInfo = listeners.get(eventName) || [];
      for (const listener of listenerInfo) {
        eventFlowContent += `    ${emitterInfo.className}.${emitterInfo.methodName} -- Emits --> ${eventName};\n`;
        eventFlowContent += `    ${eventName} -- Triggers --> ${listener.className}.${listener.methodName};\n`;
      }
    }
    eventFlowContent += '```\n';
    await writeFile('EVENT_FLOW.md', eventFlowContent);

    console.log('Documentation generated successfully.');
  }
}
