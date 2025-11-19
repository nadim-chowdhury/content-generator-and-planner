import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DdosProtectionService } from '../services/ddos-protection.service';

/**
 * DDOS Protection Middleware
 * 
 * Applies rate limiting and request size checks to all incoming requests
 */
@Injectable()
export class DdosProtectionMiddleware implements NestMiddleware {
  constructor(private ddosProtectionService: DdosProtectionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ipAddress = this.getIpAddress(req);

    if (!ipAddress) {
      return next(); // Allow if IP cannot be determined
    }

    // Check if IP is blocked
    const isBlocked = await this.ddosProtectionService.isBlocked(ipAddress);
    if (isBlocked) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check request size
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const sizeCheck = this.ddosProtectionService.checkRequestSize(contentLength);
    if (!sizeCheck.allowed) {
      throw new HttpException(
        sizeCheck.reason || 'Request too large',
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    // Check rate limits
    const rateLimit = await this.ddosProtectionService.checkRateLimit(ipAddress);
    if (!rateLimit.allowed) {
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', '100');
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', '60');
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());

    next();
  }

  private getIpAddress(req: Request): string | null {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : typeof xForwardedFor === 'string'
        ? xForwardedFor.split(',')[0].trim()
        : null;

    return (
      (req as any).ip ||
      req.connection?.remoteAddress ||
      (req.socket as any)?.remoteAddress ||
      forwardedIp ||
      null
    );
  }
}


