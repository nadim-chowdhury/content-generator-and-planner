import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { DdosProtectionService } from './services/ddos-protection.service';
import { DdosProtectionMiddleware } from './middleware/ddos-protection.middleware';
import { BackupService } from './services/backup.service';
import { PitrService } from './services/pitr.service';
import { InfrastructureController } from './infrastructure.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    PrismaModule,
  ],
  providers: [
    DdosProtectionService,
    BackupService,
    PitrService,
  ],
  controllers: [InfrastructureController],
  exports: [
    DdosProtectionService,
    BackupService,
    PitrService,
  ],
})
export class InfrastructureModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DdosProtectionMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
