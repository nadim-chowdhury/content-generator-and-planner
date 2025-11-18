import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { SpamPreventionService, SpamIdentifierType } from '../services/spam-prevention.service';

@Injectable()
export class SpamPreventionGuard implements CanActivate {
  constructor(private spamPreventionService: SpamPreventionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ipAddress = this.getIpAddress(request);

    // Check IP blocking
    if (ipAddress) {
      const isIpBlocked = await this.spamPreventionService.isBlocked(ipAddress, 'ip');
      if (isIpBlocked) {
        throw new HttpException(
          'Too many attempts from this IP. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Check email blocking (if email is in request body)
    if (request.body?.email) {
      const isEmailBlocked = await this.spamPreventionService.isBlocked(request.body.email, 'email');
      if (isEmailBlocked) {
        throw new HttpException(
          'Too many attempts with this email. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }

  private getIpAddress(request: Request): string | null {
    const xForwardedFor = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(xForwardedFor) 
      ? xForwardedFor[0] 
      : (typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : null);
    
    return (
      (request as any).ip ||
      request.connection?.remoteAddress ||
      (request.socket as any)?.remoteAddress ||
      forwardedIp ||
      null
    );
  }
}

