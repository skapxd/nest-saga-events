// src/notifications/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Module({
  providers: [NotificationService],
})
export class NotificationsModule {}
