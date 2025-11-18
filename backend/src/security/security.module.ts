import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IpThrottleService } from './services/ip-throttle.service';
import { SpamPreventionService } from './services/spam-prevention.service';
import { IpThrottleGuard } from './guards/ip-throttle.guard';
import { SpamPreventionGuard } from './guards/spam-prevention.guard';

@Module({
  imports: [PrismaModule],
  providers: [IpThrottleService, SpamPreventionService, IpThrottleGuard, SpamPreventionGuard],
  exports: [IpThrottleService, SpamPreventionService, IpThrottleGuard, SpamPreventionGuard],
})
export class SecurityModule {}

