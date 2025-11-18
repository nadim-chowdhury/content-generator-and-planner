import { Module } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { IdeasController } from './ideas.controller';
import { PlatformOptimizerService } from './services/platform-optimizer.service';
import { LanguageService } from './services/language.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IdeasController],
  providers: [IdeasService, PlatformOptimizerService, LanguageService],
  exports: [IdeasService, PlatformOptimizerService, LanguageService],
})
export class IdeasModule {}

