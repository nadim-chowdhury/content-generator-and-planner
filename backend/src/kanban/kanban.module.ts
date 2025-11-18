import { Module } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { KanbanController } from './kanban.controller';
import { AiTasksService } from './services/ai-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KanbanController],
  providers: [KanbanService, AiTasksService],
  exports: [KanbanService],
})
export class KanbanModule {}

