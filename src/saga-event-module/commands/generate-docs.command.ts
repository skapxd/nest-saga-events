import { Command, CommandRunner } from 'nest-commander';
import { format } from 'prettier';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Logger } from '@nestjs/common';
import {
  EMITS_EVENT_METADATA_KEY,
  EmitsEventMetadata,
} from '../decorators/emits-event.decorator';
import { glob } from 'glob';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, parse } from 'path';
import { existsSync } from 'fs';

@Command({
  name: 'generate-docs',
  description: 'Generate event documentation and type definitions',
})
export class GenerateDocsCommand extends CommandRunner {
  private readonly logger = new Logger(GenerateDocsCommand.name);

  constructor(private readonly discoveryService: DiscoveryService) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('Starting documentation generation...');

    // Discover Emitters
    const providersWithEmitters =
      await this.discoveryService.providersWithMetaAtKey<EmitsEventMetadata[]>(
        EMITS_EVENT_METADATA_KEY,
      );

    this.logger.log(
      `Discovered ${providersWithEmitters.length} providers with event emitters.`,
    );

    const events = new Map<
      string,
      { description?: string; payloadName?: string }
    >();
    const payloadImports = new Set<string>();

    for (const provider of providersWithEmitters) {
      const metadataList = provider.meta;

      this.logger.log(
        `Processing provider: ${provider.discoveredClass.name} with ${metadataList.length} event decorators.`,
      );

      for (const metadata of metadataList) {
        if (metadata.onInit) {
          await this.addEvent(events, payloadImports, metadata.onInit);
        }
        if (metadata.onSuccess) {
          await this.addEvent(events, payloadImports, metadata.onSuccess);
        }
        if (metadata.onFailure) {
          await this.addEvent(events, payloadImports, metadata.onFailure);
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

    // --- Optimization: Check for changes before writing ---
    if (existsSync(outputPath)) {
      const existingContent = await readFile(outputPath, 'utf-8');
      if (existingContent === formattedContent) {
        this.logger.log(
          'No changes detected in event definitions. Skipping file write.',
        );
        return;
      }
    }

    // --- Write file if it's new or has changed ---
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
    events: Map<string, { description?: string; payloadName?: string }>,
    payloadImports: Set<string>,
    eventDefinition: {
      name: string;
      description?: string;
      payload?: new (...args: any[]) => any;
    },
  ) {
    const eventName = eventDefinition.name;
    const payloadName = eventDefinition.payload?.name;

    if (events.has(eventName)) {
      return;
    }

    events.set(eventName, {
      description: eventDefinition.description ?? '',
      payloadName,
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
    const files = await glob(`src/**/*.events.ts`);
    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      if (content.includes(`class ${payloadName}`)) {
        const srcDir = join(process.cwd(), 'src');
        const payloadPath = file
          .replace(srcDir, '')
          .replace(/\\/g, '/')
          .replace('.ts', '');
        return `#/${payloadPath}`;
      }
    }
    return null;
  }

  private generateFileContent(
    events: Map<string, { description?: string; payloadName?: string }>,
    payloadImports: Set<string>,
  ): string {
    const eventDefinitions = Array.from(events.entries()).map(
      ([eventName, { description, payloadName }]) => {
        const eventConstantName = eventName.toUpperCase().replace(/\./g, '_');
        return `
        /**
         * ${description}
         */
        '${eventConstantName}': {
          name: '${eventName}',
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
