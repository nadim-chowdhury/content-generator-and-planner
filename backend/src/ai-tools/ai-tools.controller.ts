import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service';
import { ScriptGeneratorDto } from './dto/script-generator.dto';
import { RewriteDto } from './dto/rewrite.dto';
import { ElaborateIdeaDto } from './dto/elaborate-idea.dto';
import { OptimizeTitleDto } from './dto/optimize-title.dto';
import { CalendarAutofillDto } from './dto/calendar-autofill.dto';
import { CompetitorAnalysisDto } from './dto/competitor-analysis.dto';
import { NicheResearchDto } from './dto/niche-research.dto';
import { TrendingTopicsDto } from './dto/trending-topics.dto';
import { AudiencePersonaDto } from './dto/audience-persona.dto';
import { ViralScoreDto } from './dto/viral-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/ai-tools')
@UseGuards(JwtAuthGuard)
export class AiToolsController {
  constructor(private readonly aiToolsService: AiToolsService) {}

  @Post('script-generator')
  async generateScript(@Body() dto: ScriptGeneratorDto) {
    return this.aiToolsService.generateScript(dto);
  }

  @Post('rewrite')
  async rewriteContent(@Body() dto: RewriteDto) {
    return this.aiToolsService.rewriteContent(dto);
  }

  @Post('elaborate-idea')
  async elaborateIdea(@Body() dto: ElaborateIdeaDto) {
    return this.aiToolsService.elaborateIdea(dto);
  }

  @Post('optimize-title')
  async optimizeTitle(@Body() dto: OptimizeTitleDto) {
    return this.aiToolsService.optimizeTitle(dto);
  }

  @Post('calendar-autofill')
  async autofillCalendar(@Body() dto: CalendarAutofillDto) {
    return this.aiToolsService.autofillCalendar(dto);
  }

  @Post('competitor-analysis')
  async analyzeCompetitors(@Body() dto: CompetitorAnalysisDto) {
    return this.aiToolsService.analyzeCompetitors(dto);
  }

  @Post('niche-research')
  async researchNiche(@Body() dto: NicheResearchDto) {
    return this.aiToolsService.researchNiche(dto);
  }

  @Post('trending-topics')
  async generateTrendingTopics(@Body() dto: TrendingTopicsDto) {
    return this.aiToolsService.generateTrendingTopics(dto);
  }

  @Post('audience-persona')
  async buildAudiencePersona(@Body() dto: AudiencePersonaDto) {
    return this.aiToolsService.buildAudiencePersona(dto);
  }

  @Post('viral-score')
  async predictViralScore(@Body() dto: ViralScoreDto) {
    return this.aiToolsService.predictViralScore(dto);
  }
}
