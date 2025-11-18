import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(user.id, createTaskDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: TaskStatus,
    @Query('platform') platform?: string,
    @Query('tags') tags?: string, // Comma-separated tags
    @Query('search') search?: string,
    @Query('deadlineFrom') deadlineFrom?: string,
    @Query('deadlineTo') deadlineTo?: string,
  ) {
    const tagArray = tags ? tags.split(',').map((t) => t.trim()) : undefined;
    return this.tasksService.findAll(
      user.id,
      status,
      platform,
      tagArray,
      search,
      deadlineFrom,
      deadlineTo,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.findOne(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, updateTaskDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.remove(user.id, id);
  }

  @Post('bulk-delete')
  bulkDelete(@CurrentUser() user: any, @Body() dto: { taskIds: string[] }) {
    return this.tasksService.bulkDelete(user.id, dto.taskIds);
  }

  @Post('bulk-update-status')
  bulkUpdateStatus(
    @CurrentUser() user: any,
    @Body() dto: { taskIds: string[]; status: TaskStatus },
  ) {
    return this.tasksService.bulkUpdateStatus(user.id, dto.taskIds, dto.status);
  }
}


