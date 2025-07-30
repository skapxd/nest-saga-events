import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { SagaEventModule } from './saga-event-module/saga-event.module';
import { UserModule } from './user/user.module';
import { NotificationsModule } from './notifications/notification.module';

@Module({
  imports: [AuditModule, SagaEventModule, UserModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
