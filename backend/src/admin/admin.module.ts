import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BusinessAnalyticsService } from './services/business-analytics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [BusinessAnalyticsService],
  exports: [BusinessAnalyticsService],
})
export class AdminModule {}

