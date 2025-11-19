import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLANS_KEY } from '../decorators/plans.decorator';

@Injectable()
export class PlansGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(
      PLANS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlans) {
      return true; // No plan requirements
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasPlan = requiredPlans.includes(user.plan);

    if (!hasPlan) {
      throw new ForbiddenException(
        `This feature requires ${requiredPlans.join(' or ')} plan`,
      );
    }

    return true;
  }
}
