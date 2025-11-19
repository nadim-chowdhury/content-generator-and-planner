import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IpThrottleService } from '../services/ip-throttle.service';

@Injectable()
export class IpThrottleGuard implements CanActivate {
  constructor(private ipThrottleService: IpThrottleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ipAddress = this.getIpAddress(request);

    if (!ipAddress) {
      return true; // Allow if IP cannot be determined
    }

    const isBlocked = await this.ipThrottleService.isBlocked(ipAddress);

    if (isBlocked) {
      throw new HttpException(
        'Too many failed attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getIpAddress(request: any): string | null {
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      (request.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      null
    );
  }
}
