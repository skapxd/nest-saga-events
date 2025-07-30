import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';

// Define a generic structure for our JSON database
interface DbData {
  [collectionName: string]: any[];
}

@Injectable()
export class JsonDatabaseService implements OnModuleInit {
  private db: Low<DbData>;
  private readonly logger = new Logger(JsonDatabaseService.name);

  async onModuleInit() {
    const filePath = join(process.cwd(), 'event-log.db.json');
    const adapter = new JSONFile<DbData>(filePath);
    this.db = new Low<DbData>(adapter, {}); // Start with an empty object as default data

    this.logger.log(`Initializing JSON database at ${filePath}`);
    await this.db.read();
    await this.db.write(); // Ensures the file is created if it doesn't exist
    this.logger.log('JSON database initialized successfully.');
  }

  async addToCollection<T>(collectionName: string, item: T): Promise<void> {
    if (!this.db.data[collectionName]) {
      this.db.data[collectionName] = [];
    }
    this.db.data[collectionName].push(item);
    await this.db.write();
  }

  async getCollection<T>(collectionName: string): Promise<T[]> {
    await this.db.read();
    return this.db.data[collectionName] || [];
  }

  async findInCollection<T>(
    collectionName: string,
    predicate: (item: T) => boolean,
  ): Promise<T[]> {
    await this.db.read();
    const collection = this.db.data[collectionName] || [];
    return collection.filter(predicate);
  }
}
