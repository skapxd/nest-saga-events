import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { NotificationsModule } from './notifications/notification.module';

@Module({
  imports: [
    // Simple Example
    UserModule,
    NotificationsModule,
  ],
})
export class SimpleModule {}
