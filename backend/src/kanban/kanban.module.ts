import { Module } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { KanbanController } from './kanban.controller';
import { AiTasksService } from './services/ai-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [PrismaModule, CollaborationModule, TeamsModule],
  controllers: [KanbanController],
  providers: [KanbanService, AiTasksService],
  exports: [KanbanService],
})
export class KanbanModule {}
