import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SagaEventModule } from './saga-event-module/saga-event.module';
import { SimpleModule } from './sample/simple/simple.module';
import { ECommerceModule } from './sample/ecommerce/ecommerce.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, SagaEventModule, SimpleModule, ECommerceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
