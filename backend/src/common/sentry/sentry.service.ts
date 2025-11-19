import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Injectable()
export class SentryService implements OnModuleInit {
  onModuleInit() {
    const dsn = process.env.SENTRY_DSN;
    
    if (!dsn) {
      console.warn('⚠️  Sentry DSN not configured. Error monitoring disabled.');
      return;
    }

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Release tracking
      release: process.env.APP_VERSION || '1.0.0',
      // Filter out health checks and other noise
      ignoreErrors: [
        'ValidationError',
        'UnauthorizedException',
        'ForbiddenException',
      ],
      beforeSend(event, hint) {
        // Don't send events in development unless explicitly enabled
        if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_DEV) {
          return null;
        }
        return event;
      },
    });

    console.log('✅ Sentry error monitoring initialized');
  }

  captureException(exception: any, context?: Record<string, any>) {
    if (context) {
      Sentry.withScope((scope) => {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, context[key]);
        });
        Sentry.captureException(exception);
      });
    } else {
      Sentry.captureException(exception);
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
    if (context) {
      Sentry.withScope((scope) => {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, context[key]);
        });
        Sentry.captureMessage(message, level);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser(user);
  }

  setContext(key: string, context: Record<string, any>) {
    Sentry.setContext(key, context);
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

