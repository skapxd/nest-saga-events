import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [EventEmitterModule.forRoot(), AuditModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
