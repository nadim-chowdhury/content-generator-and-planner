import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        platform: dto.platform,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        attachments: dto.attachments || [],
        tags: dto.tags || [],
        viralScore: dto.viralScore,
        notes: dto.notes,
      },
    });
  }

  async findAll(
    userId: string,
    status?: TaskStatus,
    platform?: string,
    tags?: string[],
    search?: string,
    deadlineFrom?: string,
    deadlineTo?: string,
  ) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (platform) {
      where.platform = platform;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (deadlineFrom || deadlineTo) {
      where.deadline = {};
      if (deadlineFrom) {
        where.deadline.gte = new Date(deadlineFrom);
      }
      if (deadlineTo) {
        where.deadline.lte = new Date(deadlineTo);
      }
    }

    return this.prisma.task.findMany({
      where,
      orderBy: [
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const updateData: any = {
      title: dto.title,
      description: dto.description,
      platform: dto.platform,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      attachments: dto.attachments,
      tags: dto.tags,
      viralScore: dto.viralScore,
      notes: dto.notes,
      status: dto.status,
    };

    // Set completedAt when status changes to COMPLETED
    if (dto.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (dto.status !== TaskStatus.COMPLETED && task.status === TaskStatus.COMPLETED) {
      updateData.completedAt = null;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return this.prisma.task.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async bulkDelete(userId: string, taskIds: string[]) {
    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        userId,
      },
    });

    if (tasks.length !== taskIds.length) {
      throw new ForbiddenException('Some tasks not found or access denied');
    }

    await this.prisma.task.deleteMany({
      where: {
        id: { in: taskIds },
        userId,
      },
    });

    return { message: `${taskIds.length} tasks deleted successfully` };
  }

  async bulkUpdateStatus(userId: string, taskIds: string[], status: TaskStatus) {
    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        userId,
      },
    });

    if (tasks.length !== taskIds.length) {
      throw new ForbiddenException('Some tasks not found or access denied');
    }

    const updateData: any = { status };
    if (status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    await this.prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        userId,
      },
      data: updateData,
    });

    return { message: `${taskIds.length} tasks updated successfully` };
  }
}



