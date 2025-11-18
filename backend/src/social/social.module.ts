import { Module } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { FacebookService } from './facebook.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialController],
  providers: [SocialService, FacebookService],
  exports: [SocialService],
})
export class SocialModule {}

