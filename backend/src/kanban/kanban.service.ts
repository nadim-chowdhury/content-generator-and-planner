import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKanbanCardDto, KanbanStage } from './dto/create-kanban-card.dto';
import { UpdateKanbanCardDto } from './dto/update-kanban-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { AddChecklistDto } from './dto/add-checklist.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { CollaborationService } from '../collaboration/collaboration.service';
import { CollaborationGateway } from '../collaboration/collaboration.gateway';
import { TeamActivityService } from '../teams/services/team-activity.service';

@Injectable()
export class KanbanService {
  constructor(
    private prisma: PrismaService,
    private collaborationService: CollaborationService,
    private collaborationGateway: CollaborationGateway,
    private teamActivityService: TeamActivityService,
  ) {}

  /**
   * Get all cards for a user, organized by stage
   */
  async getBoard(userId: string) {
    const cards = await this.prisma.kanbanCard.findMany({
      where: { userId },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
            viralScore: true,
          },
        },
        checklists: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ stage: 'asc' }, { position: 'asc' }],
    });

    // Organize by stage
    const board: Record<KanbanStage, any[]> = {
      [KanbanStage.IDEAS]: [],
      [KanbanStage.DRAFTING]: [],
      [KanbanStage.EDITING]: [],
      [KanbanStage.READY]: [],
      [KanbanStage.SCHEDULED]: [],
      [KanbanStage.POSTED]: [],
    };

    cards.forEach((card) => {
      board[card.stage as KanbanStage].push(card);
    });

    return board;
  }

  /**
   * Create a new card
   */
  async createCard(userId: string, dto: CreateKanbanCardDto) {
    // Get max position in the target stage
    const maxPosition = await this.prisma.kanbanCard.findFirst({
      where: {
        userId,
        stage: dto.stage || KanbanStage.IDEAS,
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.kanbanCard.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        stage: dto.stage || KanbanStage.IDEAS,
        position: (maxPosition?.position || -1) + 1,
        ideaId: dto.ideaId,
        color: dto.color,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        attachments: dto.attachments || [],
        assignedTo: dto.assignedTo || [],
      },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
            viralScore: true,
          },
        },
        checklists: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update a card
   */
  async updateCard(userId: string, cardId: string, dto: UpdateKanbanCardDto) {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.stage !== undefined) updateData.stage = dto.stage;
    if (dto.position !== undefined) updateData.position = dto.position;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.dueDate !== undefined)
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.attachments !== undefined) updateData.attachments = dto.attachments;
    if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo;

    return this.prisma.kanbanCard.update({
      where: { id: cardId },
      data: updateData,
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
            viralScore: true,
          },
        },
        checklists: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Move a card to a different stage/position
   */
  async moveCard(userId: string, cardId: string, dto: MoveCardDto) {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const targetPosition =
      dto.targetPosition !== undefined
        ? dto.targetPosition
        : (await this.getMaxPosition(userId, dto.targetStage)) + 1;

    // If moving to different stage, update positions in both stages
    if (card.stage !== dto.targetStage) {
      // Shift cards in target stage
      await this.prisma.kanbanCard.updateMany({
        where: {
          userId,
          stage: dto.targetStage,
          position: { gte: targetPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });

      // Shift cards in source stage
      await this.prisma.kanbanCard.updateMany({
        where: {
          userId,
          stage: card.stage,
          position: { gt: card.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    } else {
      // Same stage, just reordering
      if (targetPosition < card.position) {
        await this.prisma.kanbanCard.updateMany({
          where: {
            userId,
            stage: card.stage,
            position: { gte: targetPosition, lt: card.position },
          },
          data: {
            position: { increment: 1 },
          },
        });
      } else if (targetPosition > card.position) {
        await this.prisma.kanbanCard.updateMany({
          where: {
            userId,
            stage: card.stage,
            position: { gt: card.position, lte: targetPosition },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      }
    }

    return this.prisma.kanbanCard.update({
      where: { id: cardId },
      data: {
        stage: dto.targetStage,
        position: targetPosition,
      },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
            viralScore: true,
          },
        },
        checklists: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get max position in a stage
   */
  private async getMaxPosition(
    userId: string,
    stage: KanbanStage,
  ): Promise<number> {
    const maxCard = await this.prisma.kanbanCard.findFirst({
      where: { userId, stage },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return maxCard?.position ?? -1;
  }

  /**
   * Delete a card
   */
  async deleteCard(userId: string, cardId: string) {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Shift remaining cards
    await this.prisma.kanbanCard.updateMany({
      where: {
        userId,
        stage: card.stage,
        position: { gt: card.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    return this.prisma.kanbanCard.delete({
      where: { id: cardId },
    });
  }

  /**
   * Add checklist to card
   */
  async addChecklist(userId: string, cardId: string, dto: AddChecklistDto) {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return this.prisma.kanbanChecklist.create({
      data: {
        cardId,
        title: dto.title,
        items: dto.items || [],
      },
    });
  }

  /**
   * Update checklist
   */
  async updateChecklist(
    userId: string,
    checklistId: string,
    items: Array<{ id: string; text: string; completed: boolean }>,
  ) {
    const checklist = await this.prisma.kanbanChecklist.findFirst({
      where: { id: checklistId },
      include: { card: true },
    });

    if (!checklist || checklist.card.userId !== userId) {
      throw new NotFoundException('Checklist not found');
    }

    return this.prisma.kanbanChecklist.update({
      where: { id: checklistId },
      data: { items },
    });
  }

  /**
   * Delete checklist
   */
  async deleteChecklist(userId: string, checklistId: string) {
    const checklist = await this.prisma.kanbanChecklist.findFirst({
      where: { id: checklistId },
      include: { card: true },
    });

    if (!checklist || checklist.card.userId !== userId) {
      throw new NotFoundException('Checklist not found');
    }

    return this.prisma.kanbanChecklist.delete({
      where: { id: checklistId },
    });
  }

  /**
   * Add comment to card
   */
  async addComment(userId: string, cardId: string, dto: AddCommentDto) {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId },
      include: {
        user: {
          select: {
            id: true,
            currentWorkspaceId: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Get workspace from card owner's current workspace
    const workspaceId = card.user.currentWorkspaceId;

    // Extract mentions from comment
    const mentionStrings = this.collaborationService.extractMentions(
      dto.content,
    );
    const mentionedUserIds = await this.collaborationService.resolveMentions(
      mentionStrings,
      workspaceId,
    );

    // Create comment with mentions
    const comment = await this.prisma.kanbanComment.create({
      data: {
        cardId,
        userId,
        content: dto.content,
        mentions: mentionedUserIds,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    // Notify mentioned users
    if (mentionedUserIds.length > 0 && workspaceId) {
      await this.collaborationService.notifyMentions(
        mentionedUserIds,
        workspaceId,
        cardId,
        comment.id,
        userId,
      );
    }

    // Log team activity
    if (workspaceId) {
      await this.teamActivityService.logCommentAdded(
        workspaceId,
        userId,
        card.title,
        cardId,
        comment.id,
      );
    }

    // Broadcast real-time update
    if (workspaceId) {
      this.collaborationGateway.broadcastComment(
        workspaceId,
        cardId,
        comment,
        userId,
      );
    }

    return comment;
  }

  /**
   * Delete comment
   */
  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.kanbanComment.findFirst({
      where: { id: commentId, userId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.prisma.kanbanComment.delete({
      where: { id: commentId },
    });
  }

  /**
   * Get card details
   */
  async getCard(userId: string, cardId: string) {
    const card = await this.prisma.kanbanCard.findFirst({
      where: { id: cardId, userId },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
            viralScore: true,
          },
        },
        checklists: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  /**
   * Create card from idea
   */
  async createCardFromIdea(
    userId: string,
    ideaId: string,
    stage?: KanbanStage,
  ) {
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    const maxPosition = await this.prisma.kanbanCard.findFirst({
      where: {
        userId,
        stage: stage || KanbanStage.IDEAS,
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.kanbanCard.create({
      data: {
        userId,
        title: idea.title,
        description: idea.description || undefined,
        stage: stage || KanbanStage.IDEAS,
        position: (maxPosition?.position || -1) + 1,
        ideaId: idea.id,
        color: '#6366F1', // Default indigo
      },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            platform: true,
            viralScore: true,
          },
        },
        checklists: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  }
}
