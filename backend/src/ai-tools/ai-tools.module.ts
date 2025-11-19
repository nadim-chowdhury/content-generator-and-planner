import { Module } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service';
import { AiToolsController } from './ai-tools.controller';
import { IdeasModule } from '../ideas/ideas.module'; // Import to use LanguageService

@Module({
  imports: [IdeasModule],
  controllers: [AiToolsController],
  providers: [AiToolsService],
  exports: [AiToolsService],
})
export class AiToolsModule {}
