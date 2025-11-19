import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamRole } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a team (Agency owners only)
   */
  async createTeam(ownerId: string, name: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException('User not found');
    }

    if (owner.plan !== 'AGENCY') {
      throw new ForbiddenException('Only Agency plan users can create teams');
    }

    return this.prisma.team.create({
      data: {
        name,
        ownerId,
      },
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
  }

  /**
   * Get user's teams
   */
  async getUserTeams(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get teams owned by user
    const ownedTeams = await this.prisma.team.findMany({
      where: { ownerId: userId },
      include: {
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

    // Get teams where user is a member
    const memberTeams = await this.prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
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
        },
      },
    });

    return {
      owned: ownedTeams,
      memberOf: memberTeams.map((tm) => tm.team),
    };
  }

  /**
   * Get team details
   */
  async getTeam(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
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
      throw new NotFoundException('Team not found');
    }

    // Check if user has access (owner or member)
    const isOwner = team.ownerId === userId;
    const isMember = team.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this team');
    }

    return team;
  }

  /**
   * Invite member to team
   */
  async inviteMember(
    teamId: string,
    ownerId: string,
    userEmail: string,
    role: string = 'VIEWER',
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== ownerId) {
      throw new ForbiddenException('Only team owner can invite members');
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a team member');
    }

    // Create team member
    return this.prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        role: role as TeamRole,
        invitedBy: ownerId,
      },
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
    });
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, ownerId: string, memberId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== ownerId) {
      throw new ForbiddenException('Only team owner can remove members');
    }

    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: memberId,
        },
      },
    });

    return { message: 'Member removed successfully' };
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    teamId: string,
    ownerId: string,
    memberId: string,
    role: string,
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== ownerId) {
      throw new ForbiddenException('Only team owner can update member roles');
    }

    if (!['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN'].includes(role)) {
      throw new BadRequestException(
        'Invalid role. Must be VIEWER, EDITOR, MANAGER, or ADMIN',
      );
    }

    return this.prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: memberId,
        },
      },
      data: { role: role as TeamRole },
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
    });
  }

  /**
   * Leave team
   */
  async leaveTeam(teamId: string, userId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      include: {
        team: true,
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this team');
    }

    // Cannot leave if you're the owner
    if (member.team.ownerId === userId) {
      throw new BadRequestException(
        'Team owner cannot leave. Transfer ownership or delete team first.',
      );
    }

    await this.prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    return { message: 'Left team successfully' };
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string, ownerId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== ownerId) {
      throw new ForbiddenException('Only team owner can delete team');
    }

    await this.prisma.team.delete({
      where: { id: teamId },
    });

    return { message: 'Team deleted successfully' };
  }

  /**
   * Update team name
   */
  async updateTeam(teamId: string, ownerId: string, name: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== ownerId) {
      throw new ForbiddenException('Only team owner can update team');
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: { name },
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
  }
}
