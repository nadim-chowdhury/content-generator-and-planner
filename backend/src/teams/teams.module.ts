import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceService } from './services/workspace.service';
import { PermissionsService } from './services/permissions.service';
import { TeamActivityService } from './services/team-activity.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeamsController],
  providers: [
    TeamsService,
    WorkspaceService,
    PermissionsService,
    TeamActivityService,
  ],
  exports: [
    TeamsService,
    WorkspaceService,
    PermissionsService,
    TeamActivityService,
  ],
})
export class TeamsModule {}
