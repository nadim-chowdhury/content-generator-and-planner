import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - now;

          this.logger.info('HTTP Request', {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            query,
            params,
            // Don't log sensitive data
            body: this.sanitizeBody(body),
          });
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `HTTP Request Error: ${method} ${url} - ${error.message}`,
            error.stack,
            'HTTP',
          );
          this.logger.info('HTTP Request Error Details', {
            method,
            url,
            error: error.message,
            responseTime: `${responseTime}ms`,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'accessToken',
      'refreshToken',
    ];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
