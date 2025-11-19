import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SentryService } from './common/sentry/sentry.service';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhooks
    logger: false, // We'll use our custom logger
  });

  // Initialize Sentry (must be done before other middleware)
  const sentryService = app.get(SentryService);
  sentryService.onModuleInit();

  // Get logger service
  const logger = app.get(LoggerService);

  // Use custom logger
  app.useLogger(logger);

  // Global exception filter for Sentry
  app.useGlobalFilters(new SentryExceptionFilter(sentryService));

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Stripe iframes
    }),
  );

  // Enhanced CORS protection
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [process.env.FRONTEND_URL || 'http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === 'development'
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // 24 hours
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation (generate asynchronously to not block startup)
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_SWAGGER === 'true'
  ) {
    // Generate Swagger in background to not block server startup
    setImmediate(() => {
      try {
        const config = new DocumentBuilder()
          .setTitle('Content Generator & Planner API')
          .setDescription('API documentation for Content Generator & Planner SaaS')
          .setVersion('1.0')
          .addBearerAuth(
            {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              name: 'JWT',
              description: 'Enter JWT token',
              in: 'header',
            },
            'JWT-auth',
          )
          .addTag('auth', 'Authentication endpoints')
          .addTag('ideas', 'Content ideas management')
          .addTag('planner', 'Content planning and scheduling')
          .addTag('billing', 'Billing and subscription management')
          .addTag('teams', 'Team and workspace management')
          .addTag('admin', 'Admin panel endpoints')
          .addTag('ai-tools', 'AI-powered content tools')
          .addServer(
            process.env.API_URL || 'http://localhost:3000',
            'Development server',
          )
          .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document, {
          customSiteTitle: 'Content Generator API Docs',
          customfavIcon: '/favicon.ico',
          customCss: '.swagger-ui .topbar { display: none }',
        });

        logger.log(`📚 Swagger API documentation available at /api/docs`);
      } catch (error: any) {
        logger.warn(`Failed to generate Swagger docs: ${error.message}`);
      }
    });
  }

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`🚀 Backend server running on http://localhost:${port}`);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // Exit gracefully
  process.exit(1);
});

// Bootstrap with error handling
bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
