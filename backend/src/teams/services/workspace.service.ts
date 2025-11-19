import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Workspace Service
 * Handles workspace switching and current workspace management
 */
@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Switch to a workspace (team)
   */
  async switchWorkspace(userId: string, workspaceId: string) {
    // Verify user has access to this workspace
    const team = await this.prisma.team.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user is owner or member
    const isOwner = team.ownerId === userId;
    const isMember = team.members.length > 0;

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Update user's current workspace
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentWorkspaceId: workspaceId },
    });

    return {
      message: 'Workspace switched successfully',
      workspace: {
        id: team.id,
        name: team.name,
      },
    };
  }

  /**
   * Get current workspace
   */
  async getCurrentWorkspace(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentWorkspaceId: true },
    });

    if (!user || !user.currentWorkspaceId) {
      return null;
    }

    const team = await this.prisma.team.findUnique({
      where: { id: user.currentWorkspaceId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      // Workspace no longer exists, clear it
      await this.prisma.user.update({
        where: { id: userId },
        data: { currentWorkspaceId: null },
      });
      return null;
    }

    // Check if user still has access
    const isOwner = team.ownerId === userId;
    const isMember = team.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      // User no longer has access, clear workspace
      await this.prisma.user.update({
        where: { id: userId },
        data: { currentWorkspaceId: null },
      });
      return null;
    }

    return team;
  }

  /**
   * Clear current workspace (switch to personal)
   */
  async clearWorkspace(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentWorkspaceId: null },
    });

    return { message: 'Switched to personal workspace' };
  }
}
