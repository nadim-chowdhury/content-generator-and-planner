import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BusinessAnalyticsService } from './services/business-analytics.service';
import { AdminUserManagementService } from './services/admin-user-management.service';
import { AdminBillingService } from './services/admin-billing.service';
import { PlatformSettingsService } from './services/platform-settings.service';
import { ContentModerationService } from './services/content-moderation.service';
import { EnhancedAnalyticsService } from './services/enhanced-analytics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AdminController],
  providers: [
    BusinessAnalyticsService,
    AdminUserManagementService,
    AdminBillingService,
    PlatformSettingsService,
    ContentModerationService,
    EnhancedAnalyticsService,
  ],
  exports: [
    BusinessAnalyticsService,
    AdminUserManagementService,
    AdminBillingService,
    PlatformSettingsService,
    ContentModerationService,
    EnhancedAnalyticsService,
  ],
})
export class AdminModule {}
