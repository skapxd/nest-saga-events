import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { DatabaseModule } from '#/src/database/database.module';
import { VerificationFeedbackService } from './verification-feedback.service';

@Module({
  imports: [DatabaseModule],
  providers: [VerificationService, VerificationFeedbackService],
  exports: [VerificationService],
})
export class VerificationModule {}
