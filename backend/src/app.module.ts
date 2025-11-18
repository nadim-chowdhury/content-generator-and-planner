import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { IdeasModule } from './ideas/ideas.module';
import { PlannerModule } from './planner/planner.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { KanbanModule } from './kanban/kanban.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BillingModule } from './billing/billing.module';
import { SocialModule } from './social/social.module';
import { TeamsModule } from './teams/teams.module';
import { AdminModule } from './admin/admin.module';
import { AiToolsModule } from './ai-tools/ai-tools.module';
import { SecurityModule } from './security/security.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { BlogModule } from './blog/blog.module';
import { SharingModule } from './sharing/sharing.module';
import { QueueModule } from './queue/queue.module';
import { SettingsModule } from './settings/settings.module';
import { ExportImportModule } from './export-import/export-import.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'strict',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute (for auth endpoints)
      },
      {
        name: 'ai',
        ttl: 60000, // 1 minute
        limit: 20, // 20 AI requests per minute
      },
    ]),
    PrismaModule,
    SecurityModule,
    InfrastructureModule,
    CollaborationModule,
    AuthModule,
    IdeasModule,
    PlannerModule,
    TasksModule,
    NotificationsModule,
    KanbanModule,
    AnalyticsModule,
    BillingModule,
    SocialModule,
    TeamsModule,
    AdminModule,
    AiToolsModule,
    ReferralsModule,
    AffiliatesModule,
    BlogModule,
    SharingModule,
    QueueModule,
    SettingsModule,
    ExportImportModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
