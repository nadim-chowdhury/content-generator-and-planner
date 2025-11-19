import { Module, forwardRef } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { PlannerController } from './planner.controller';
import { PostingTimeSuggestionsService } from './services/posting-time-suggestions.service';
import { CalendarAutofillService } from './services/calendar-autofill.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PrismaModule, forwardRef(() => QueueModule)],
  controllers: [PlannerController],
  providers: [
    PlannerService,
    PostingTimeSuggestionsService,
    CalendarAutofillService,
  ],
  exports: [
    PlannerService,
    PostingTimeSuggestionsService,
    CalendarAutofillService,
  ],
})
export class PlannerModule {}
