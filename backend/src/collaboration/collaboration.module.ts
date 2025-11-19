import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [PrismaModule, TeamsModule],
  providers: [CollaborationGateway, CollaborationService],
  exports: [CollaborationGateway, CollaborationService],
})
export class CollaborationModule {}
