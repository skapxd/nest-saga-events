import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SagaEventModule } from './saga-event-module/saga-event.module';
import { UserModule } from './sample/simple/user/user.module';
import { NotificationsModule } from './sample/simple/notifications/notification.module';

@Module({
  imports: [SagaEventModule, UserModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
