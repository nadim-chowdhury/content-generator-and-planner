import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  /**
   * Global search
   */
  @Get()
  async search(
    @CurrentUser() user: any,
    @Query('q') query: string,
    @Query('teamId') teamId?: string,
    @Query('platforms') platforms?: string,
    @Query('tags') tags?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const platformsArray = platforms ? platforms.split(',') : undefined;
    const tagsArray = tags ? tags.split(',') : undefined;
    const statusArray = status ? status.split(',') : undefined;

    return this.searchService.globalSearch({
      query: query || '',
      userId: user.id,
      teamId,
      platforms: platformsArray,
      tags: tagsArray,
      status: statusArray,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * Get available filters
   */
  @Get('filters')
  async getFilters(
    @CurrentUser() user: any,
    @Query('teamId') teamId?: string,
  ) {
    return this.searchService.getSearchFilters(user.id, teamId);
  }

  /**
   * Save a search
   */
  @Post('save')
  async saveSearch(
    @CurrentUser() user: any,
    @Body() body: { name: string; query?: string; filters?: any; teamId?: string },
  ) {
    return this.searchService.saveSearch(user.id, body.name, body.query, body.filters, body.teamId);
  }

  /**
   * Get saved searches
   */
  @Get('saved')
  async getSavedSearches(
    @CurrentUser() user: any,
    @Query('teamId') teamId?: string,
  ) {
    return this.searchService.getSavedSearches(user.id, teamId);
  }

  /**
   * Delete saved search
   */
  @Delete('saved/:searchId')
  async deleteSavedSearch(
    @CurrentUser() user: any,
    @Param('searchId') searchId: string,
  ) {
    return this.searchService.deleteSavedSearch(user.id, searchId);
  }
}

