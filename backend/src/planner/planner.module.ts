import { Module } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { PlannerController } from './planner.controller';
import { PostingTimeSuggestionsService } from './services/posting-time-suggestions.service';
import { CalendarAutofillService } from './services/calendar-autofill.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlannerController],
  providers: [PlannerService, PostingTimeSuggestionsService, CalendarAutofillService],
  exports: [PlannerService, PostingTimeSuggestionsService, CalendarAutofillService],
})
export class PlannerModule {}

