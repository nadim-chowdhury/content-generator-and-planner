import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UpdateWorkspaceSettingsDto } from './dto/update-workspace-settings.dto';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private teamsService: TeamsService,
  ) {}

  /**
   * Get or create user settings
   */
  async getUserSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  /**
   * Update user settings
   */
  async updateUserSettings(userId: string, updateDto: UpdateUserSettingsDto) {
    // Ensure settings exist
    await this.getUserSettings(userId);

    const updated = await this.prisma.userSettings.update({
      where: { userId },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Get workspace settings
   */
  async getWorkspaceSettings(teamId: string, userId: string) {
    // Check if user has access to this team
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
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

    let settings = await this.prisma.workspaceSettings.findUnique({
      where: { teamId },
    });

    if (!settings) {
      settings = await this.prisma.workspaceSettings.create({
        data: { teamId },
      });
    }

    return settings;
  }

  /**
   * Update workspace settings
   */
  async updateWorkspaceSettings(
    teamId: string,
    userId: string,
    updateDto: UpdateWorkspaceSettingsDto,
  ) {
    // Check if user is manager or admin of the team
    const member = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
        role: {
          in: ['MANAGER', 'ADMIN'],
        },
      },
    });

    if (!member) {
      // Check if user is the owner
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        select: { ownerId: true },
      });

      if (!team || team.ownerId !== userId) {
        throw new ForbiddenException('Only managers and admins can update workspace settings');
      }
    }

    // Ensure settings exist
    await this.getWorkspaceSettings(teamId, userId);

    const updated = await this.prisma.workspaceSettings.update({
      where: { teamId },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Get default AI settings for user
   */
  async getAISettings(userId: string) {
    const settings = await this.getUserSettings(userId);
    return {
      tone: settings.aiTone,
      style: settings.aiStyle,
      personality: settings.aiPersonality,
      maxLength: settings.aiMaxLength,
      includeHashtags: settings.aiIncludeHashtags,
      includeEmojis: settings.aiIncludeEmojis,
    };
  }

  /**
   * Get user's preferred platforms
   */
  async getPreferredPlatforms(userId: string) {
    const settings = await this.getUserSettings(userId);
    return settings.preferredPlatforms || [];
  }

  /**
   * Get workspace brand settings
   */
  async getWorkspaceBrand(teamId: string, userId: string) {
    const settings = await this.getWorkspaceSettings(teamId, userId);
    return {
      brandName: settings.brandName,
      brandColors: settings.brandColors,
      brandLogo: settings.brandLogo,
      brandFont: settings.brandFont,
    };
  }
}

