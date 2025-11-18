import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IpThrottleService } from './services/ip-throttle.service';
import { SpamPreventionService } from './services/spam-prevention.service';
import { EncryptionService } from './services/encryption.service';
import { GdprDeletionService } from './services/gdpr-deletion.service';
import { IpThrottleGuard } from './guards/ip-throttle.guard';
import { SpamPreventionGuard } from './guards/spam-prevention.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    IpThrottleService,
    SpamPreventionService,
    EncryptionService,
    GdprDeletionService,
    IpThrottleGuard,
    SpamPreventionGuard,
  ],
  exports: [
    IpThrottleService,
    SpamPreventionService,
    EncryptionService,
    GdprDeletionService,
    IpThrottleGuard,
    SpamPreventionGuard,
  ],
})
export class SecurityModule {}


