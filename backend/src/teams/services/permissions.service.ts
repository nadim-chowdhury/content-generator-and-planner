import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// import { TeamRole } from '@prisma/client';
type TeamRole = 'VIEWER' | 'EDITOR' | 'MANAGER' | 'ADMIN';

/**
 * Permissions Service
 * Handles role-based permissions for team members
 */
@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user has permission in workspace
   */
  async checkPermission(
    userId: string,
    workspaceId: string | null,
    permission: 'view' | 'edit' | 'manage' | 'admin',
  ): Promise<boolean> {
    // If no workspace, user has full access to their own content
    if (!workspaceId) {
      return true;
    }

    const team = await this.prisma.team.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!team) {
      return false;
    }

    // Owner has all permissions
    if (team.ownerId === userId) {
      return true;
    }

    const member = team.members[0];
    if (!member) {
      return false;
    }

    // Check role-based permissions
    switch (permission) {
      case 'view':
        return true; // All roles can view
      case 'edit':
        return ['EDITOR', 'MANAGER', 'ADMIN'].includes(member.role);
      case 'manage':
        return ['MANAGER', 'ADMIN'].includes(member.role);
      case 'admin':
        return member.role === 'ADMIN';
      default:
        return false;
    }
  }

  /**
   * Get user's role in workspace
   */
  async getUserRole(
    userId: string,
    workspaceId: string,
  ): Promise<TeamRole | 'OWNER' | null> {
    const team = await this.prisma.team.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!team) {
      return null;
    }

    if (team.ownerId === userId) {
      return 'OWNER' as any; // Owner is not a TeamRole but has all permissions
    }

    return team.members[0]?.role || null;
  }

  /**
   * Get role permissions
   */
  getRolePermissions(role: TeamRole | 'OWNER'): {
    canView: boolean;
    canEdit: boolean;
    canManage: boolean;
    canAdmin: boolean;
  } {
    if (role === 'OWNER') {
      return {
        canView: true,
        canEdit: true,
        canManage: true,
        canAdmin: true,
      };
    }

    switch (role) {
      case 'VIEWER':
        return {
          canView: true,
          canEdit: false,
          canManage: false,
          canAdmin: false,
        };
      case 'EDITOR':
        return {
          canView: true,
          canEdit: true,
          canManage: false,
          canAdmin: false,
        };
      case 'MANAGER':
        return {
          canView: true,
          canEdit: true,
          canManage: true,
          canAdmin: false,
        };
      case 'ADMIN':
        return {
          canView: true,
          canEdit: true,
          canManage: true,
          canAdmin: true,
        };
      default:
        return {
          canView: false,
          canEdit: false,
          canManage: false,
          canAdmin: false,
        };
    }
  }
}
