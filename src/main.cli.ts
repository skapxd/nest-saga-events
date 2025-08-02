import { CommandFactory } from 'nest-commander';
import { AppModule } from './main.module';

async function bootstrap() {
  await CommandFactory.run(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });
}

void bootstrap();
