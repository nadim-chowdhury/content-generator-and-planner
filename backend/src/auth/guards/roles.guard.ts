import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => {
      if (role === 'ADMIN') {
        return user.role === 'ADMIN';
      }
      if (role === 'AGENCY_OWNER') {
        return user.plan === 'AGENCY';
      }
      if (role === 'PRO_USER') {
        return user.plan === 'PRO' || user.plan === 'AGENCY';
      }
      if (role === 'FREE_USER') {
        return user.plan === 'FREE';
      }
      return false;
    });

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}



