import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { format } from 'prettier';
import { glob } from 'glob';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, parse } from 'path';
import { existsSync } from 'fs';
import {
  EMITS_EVENT_METADATA_KEY,
  EmitsEventMetadata,
} from '../decorators/emits-event.decorator';

@Injectable()
export class EventGeneratorService {
  private readonly logger = new Logger(EventGeneratorService.name);

  constructor(private readonly discoveryService: DiscoveryService) {}

  async generate(): Promise<void> {
    this.logger.log('Starting event types generation...');

    const providersWithEmitters =
      await this.discoveryService.providersWithMetaAtKey<EmitsEventMetadata[]>(
        EMITS_EVENT_METADATA_KEY,
      );

    this.logger.log(
      `Discovered ${providersWithEmitters.length} providers with event emitters.`,
    );

    const events = new Map<
      string,
      { description?: string; payloadName?: string; type: string }
    >();
    const payloadImports = new Set<string>();

    for (const provider of providersWithEmitters) {
      const metadataList = provider.meta;

      for (const metadata of metadataList) {
        if (metadata.onInit) {
          await this.addEvent(
            events,
            payloadImports,
            metadata.onInit,
            'onInit',
          );
        }
        if (metadata.onSuccess) {
          await this.addEvent(
            events,
            payloadImports,
            metadata.onSuccess,
            'onSuccess',
          );
        }
        if (metadata.onFailure) {
          await this.addEvent(
            events,
            payloadImports,
            metadata.onFailure,
            'onFailure',
          );
        }
      }
    }

    const generatedFileContent = this.generateFileContent(
      events,
      payloadImports,
    );

    const formattedContent = await format(generatedFileContent, {
      parser: 'typescript',
      singleQuote: true,
    });

    const outputPath = join(
      process.cwd(),
      'src',
      'saga-event-module',
      'types',
      'generated-events.ts',
    );

    if (existsSync(outputPath)) {
      const existingContent = await readFile(outputPath, 'utf-8');
      if (existingContent === formattedContent) {
        this.logger.log(
          'No changes detected in event definitions. Skipping file write.',
        );
        return;
      }
    }

    const outputDir = parse(outputPath).dir;
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }
    await writeFile(outputPath, formattedContent);

    this.logger.log(
      `✅ Event types generated and updated successfully at: ${outputPath}`,
    );
  }

  private async addEvent(
    events: Map<
      string,
      { description?: string; payloadName?: string; type: string }
    >,
    payloadImports: Set<string>,
    eventDefinition: {
      name: string;
      description?: string;
      payload?: new (...args: any[]) => any;
    },
    type: string,
  ) {
    const eventName = eventDefinition.name;
    const payloadName = eventDefinition.payload?.name;

    if (events.has(eventName)) {
      return;
    }

    events.set(eventName, {
      description: eventDefinition.description ?? '',
      payloadName,
      type,
    });

    if (payloadName) {
      const relativePath = await this.getRelativePath(payloadName);
      if (relativePath) {
        payloadImports.add(`import { ${payloadName} } from '${relativePath}';`);
      } else {
        this.logger.warn(
          `⚠️  Could not find payload file for event: ${eventName}. Skipping import.`,
        );
      }
    }
  }

  private async getRelativePath(payloadName: string): Promise<string | null> {
    const files = await glob('src/**/*.dto.ts', { absolute: true });
    const matches: string[] = [];

    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      if (content.includes(`export class ${payloadName}`)) {
        matches.push(file);
      }
    }

    if (matches.length === 0) {
      this.logger.warn(`Could not find file for payload class: ${payloadName}`);
      return null;
    }

    if (matches.length > 1) {
      const fileList = matches.map((file) => `\n   - ${file}`).join('');
      throw new Error(
        `❌ Ambiguous payload class '${payloadName}' found in multiple files:${fileList}`,
      );
    }

    const projectRoot = process.cwd();
    const importPath = matches[0]
      .replace(`${projectRoot}/src/`, '')
      .replace('.ts', '');
    return `#/src/${importPath}`;
  }

  private generateFileContent(
    events: Map<
      string,
      { description?: string; payloadName?: string; type: string }
    >,
    payloadImports: Set<string>,
  ): string {
    const eventDefinitions = Array.from(events.entries()).map(
      ([eventName, { description, payloadName, type }]) => {
        const eventConstantName = eventName.toUpperCase().replace(/\./g, '_');
        return `
        /**
         * ${description}
         */
        '${eventConstantName}': {
          name: '${eventName}',
          type: '${type}',
          description: '${description}',
          payloadClass: ${payloadName},
        },
      `;
      },
    );

    return `// This file is auto-generated by the 'generate-event-types' command.
// Do not edit this file manually.

${Array.from(payloadImports).join('\n')}

export const AppEvents = {
  ${eventDefinitions.join('\n')}
} as const;
`;
  }
}
