import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { GenerateIdeasDto } from './dto/generate-ideas.dto';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { DuplicateIdeaDto } from './dto/duplicate-idea.dto';
import { BulkOperationsDto } from './dto/bulk-operations.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveIdeasDto } from './dto/move-ideas.dto';
import { ExportIdeasDto } from './dto/export-ideas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LanguageService } from './services/language.service';

enum IdeaStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  POSTED = 'POSTED',
  ARCHIVED = 'ARCHIVED',
}

@Controller('api/ideas')
@UseGuards(JwtAuthGuard)
export class IdeasController {
  constructor(
    private readonly ideasService: IdeasService,
    private readonly languageService: LanguageService,
  ) {}

  @Post('generate')
  async generate(
    @CurrentUser() user: any,
    @Body() generateDto: GenerateIdeasDto,
  ) {
    return this.ideasService.generateIdeas(user.plan, user.id, generateDto);
  }

  @Get('languages')
  getSupportedLanguages() {
    return {
      languages: this.languageService.getSupportedLanguages(),
      default: this.languageService.getDefaultLanguage(),
    };
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() createDto: CreateIdeaDto) {
    return this.ideasService.create(user.id, createDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('status') status?: IdeaStatus,
    @Query('folderId') folderId?: string,
    @Query('tags') tags?: string, // Comma-separated tags
    @Query('search') search?: string,
    @Query('platform') platform?: string,
    @Query('language') language?: string,
    @Query('createdAtFrom') createdAtFrom?: string,
    @Query('createdAtTo') createdAtTo?: string,
    @Query('scheduledAtFrom') scheduledAtFrom?: string,
    @Query('scheduledAtTo') scheduledAtTo?: string,
    @Query('viralScoreMin') viralScoreMin?: string,
    @Query('viralScoreMax') viralScoreMax?: string,
  ) {
    const tagArray = tags ? tags.split(',').map((t) => t.trim()) : undefined;
    const viralScoreMinNum = viralScoreMin
      ? parseInt(viralScoreMin, 10)
      : undefined;
    const viralScoreMaxNum = viralScoreMax
      ? parseInt(viralScoreMax, 10)
      : undefined;
    return this.ideasService.findAll(
      user.id,
      status,
      folderId,
      tagArray,
      search,
      platform,
      language,
      createdAtFrom,
      createdAtTo,
      scheduledAtFrom,
      scheduledAtTo,
      viralScoreMinNum,
      viralScoreMaxNum,
    );
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ideasService.findOne(id, user.id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateIdeaDto,
  ) {
    return this.ideasService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ideasService.remove(id, user.id);
  }

  @Post(':id/duplicate')
  async duplicate(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: DuplicateIdeaDto,
  ) {
    return this.ideasService.duplicate(id, user.id, dto.newTitle, dto.folderId);
  }

  @Patch(':id/archive')
  async archive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ideasService.archive(id, user.id);
  }

  @Patch(':id/unarchive')
  async unarchive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ideasService.unarchive(id, user.id);
  }

  @Post('bulk')
  async bulkOperations(
    @CurrentUser() user: any,
    @Body() dto: BulkOperationsDto,
  ) {
    if (dto.operation === 'EXPORT') {
      return this.ideasService.bulkExport(
        user.id,
        dto.ideaIds,
        dto.exportFormat || 'json',
        dto.googleSheetsId,
        dto.notionDatabaseId,
      );
    }
    return this.ideasService.bulkOperations(
      user.id,
      dto.ideaIds,
      dto.operation,
      dto.folderId,
    );
  }

  @Post('export')
  async exportIdeas(@CurrentUser() user: any, @Body() dto: ExportIdeasDto) {
    return this.ideasService.bulkExport(
      user.id,
      dto.ideaIds,
      dto.format,
      dto.googleSheetsId,
      dto.notionDatabaseId,
    );
  }

  @Post('move')
  async moveIdeas(@CurrentUser() user: any, @Body() dto: MoveIdeasDto) {
    return this.ideasService.bulkOperations(
      user.id,
      dto.ideaIds,
      'MOVE',
      dto.folderId,
    );
  }

  @Get('tags/all')
  async getAllTags(@CurrentUser() user: any) {
    return this.ideasService.getAllTags(user.id);
  }

  // Folder Management
  @Post('folders')
  async createFolder(@CurrentUser() user: any, @Body() dto: CreateFolderDto) {
    return this.ideasService.createFolder(user.id, dto);
  }

  @Get('folders')
  async getFolders(@CurrentUser() user: any) {
    return this.ideasService.getFolders(user.id);
  }

  @Get('folders/:id')
  async getFolder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ideasService.getFolder(id, user.id);
  }

  @Put('folders/:id')
  async updateFolder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.ideasService.updateFolder(id, user.id, dto);
  }

  @Delete('folders/:id')
  async deleteFolder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ideasService.deleteFolder(id, user.id);
  }

  @Get('stats/summary')
  async getStats(@CurrentUser() user: any) {
    return this.ideasService.getStats(user.id);
  }
}
