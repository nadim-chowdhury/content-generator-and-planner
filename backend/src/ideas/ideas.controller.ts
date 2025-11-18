import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { GenerateIdeasDto } from './dto/generate-ideas.dto';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IdeaStatus } from '@prisma/client';

@Controller('api/ideas')
@UseGuards(JwtAuthGuard)
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post('generate')
  async generate(
    @CurrentUser() user: any,
    @Body() generateIdeasDto: GenerateIdeasDto,
  ) {
    return this.ideasService.generateIdeas(user.id, user.plan, generateIdeasDto);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createIdeaDto: CreateIdeaDto) {
    return this.ideasService.create(user.id, createIdeaDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query('status') status?: IdeaStatus) {
    return this.ideasService.findAll(user.id, status);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.ideasService.getStats(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ideasService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateIdeaDto: UpdateIdeaDto,
  ) {
    return this.ideasService.update(id, user.id, updateIdeaDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ideasService.remove(id, user.id);
  }
}

