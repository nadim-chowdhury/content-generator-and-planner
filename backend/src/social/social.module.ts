import { Module } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { FacebookService } from './facebook.service';
import { TwitterService } from './services/twitter.service';
import { FacebookPostingService } from './services/facebook.service';
import { InstagramService } from './services/instagram.service';
import { LinkedInService } from './services/linkedin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SocialController],
  providers: [
    SocialService,
    FacebookService,
    TwitterService,
    FacebookPostingService,
    InstagramService,
    LinkedInService,
  ],
  exports: [SocialService],
})
export class SocialModule {}
