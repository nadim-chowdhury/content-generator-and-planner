import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PerformanceCalculatorService } from './services/performance-calculator.service';
import { PredictionService } from './services/prediction.service';
import { UserAnalyticsService } from './services/user-analytics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    PerformanceCalculatorService,
    PredictionService,
    UserAnalyticsService,
  ],
  exports: [AnalyticsService, UserAnalyticsService],
})
export class AnalyticsModule {}
