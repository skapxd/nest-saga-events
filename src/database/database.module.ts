import { Global, Module } from '@nestjs/common';
import { JsonDatabaseService } from './json/json-database.service';

@Global()
@Module({
  providers: [JsonDatabaseService],
  exports: [JsonDatabaseService],
})
export class DatabaseModule {}
