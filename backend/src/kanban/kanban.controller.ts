import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { AiTasksService } from './services/ai-tasks.service';
import { CreateKanbanCardDto } from './dto/create-kanban-card.dto';
import { UpdateKanbanCardDto } from './dto/update-kanban-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { AddChecklistDto } from './dto/add-checklist.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { KanbanStage } from './dto/create-kanban-card.dto';

@Controller('api/kanban')
@UseGuards(JwtAuthGuard)
export class KanbanController {
  constructor(
    private readonly kanbanService: KanbanService,
    private readonly aiTasksService: AiTasksService,
  ) {}

  @Get('board')
  getBoard(@CurrentUser() user: any) {
    return this.kanbanService.getBoard(user.id);
  }

  @Get('cards/:id')
  getCard(@CurrentUser() user: any, @Param('id') id: string) {
    return this.kanbanService.getCard(user.id, id);
  }

  @Post('cards')
  createCard(@CurrentUser() user: any, @Body() dto: CreateKanbanCardDto) {
    return this.kanbanService.createCard(user.id, dto);
  }

  @Post('cards/from-idea/:ideaId')
  createCardFromIdea(
    @CurrentUser() user: any,
    @Param('ideaId') ideaId: string,
    @Body('stage') stage?: KanbanStage,
  ) {
    return this.kanbanService.createCardFromIdea(user.id, ideaId, stage);
  }

  @Put('cards/:id')
  updateCard(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateKanbanCardDto,
  ) {
    return this.kanbanService.updateCard(user.id, id, dto);
  }

  @Patch('cards/:id/move')
  moveCard(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: MoveCardDto,
  ) {
    return this.kanbanService.moveCard(user.id, id, dto);
  }

  @Delete('cards/:id')
  deleteCard(@CurrentUser() user: any, @Param('id') id: string) {
    return this.kanbanService.deleteCard(user.id, id);
  }

  @Post('cards/:id/checklists')
  addChecklist(
    @CurrentUser() user: any,
    @Param('id') cardId: string,
    @Body() dto: AddChecklistDto,
  ) {
    return this.kanbanService.addChecklist(user.id, cardId, dto);
  }

  @Put('checklists/:id')
  updateChecklist(
    @CurrentUser() user: any,
    @Param('id') checklistId: string,
    @Body('items') items: Array<{ id: string; text: string; completed: boolean }>,
  ) {
    return this.kanbanService.updateChecklist(user.id, checklistId, items);
  }

  @Delete('checklists/:id')
  deleteChecklist(@CurrentUser() user: any, @Param('id') checklistId: string) {
    return this.kanbanService.deleteChecklist(user.id, checklistId);
  }

  @Post('cards/:id/comments')
  addComment(
    @CurrentUser() user: any,
    @Param('id') cardId: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.kanbanService.addComment(user.id, cardId, dto);
  }

  @Delete('comments/:id')
  deleteComment(@CurrentUser() user: any, @Param('id') commentId: string) {
    return this.kanbanService.deleteComment(user.id, commentId);
  }

  @Get('cards/:id/ai-tasks')
  async generateAiTasks(@CurrentUser() user: any, @Param('id') cardId: string) {
    return this.aiTasksService.generateTasksForCard(cardId, user.id);
  }
}

