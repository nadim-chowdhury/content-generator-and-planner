import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/export-import')
@UseGuards(JwtAuthGuard)
export class ExportImportController {
  constructor(
    private exportService: ExportService,
    private importService: ImportService,
  ) {}

  /**
   * Export all ideas as JSON
   */
  @Get('ideas/json')
  async exportIdeasJSON(@CurrentUser() user: any, @Res() res: Response) {
    const data = await this.exportService.exportIdeas(user.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ideas-export-${Date.now()}.json"`,
    );
    res.json(data);
  }

  /**
   * Export all ideas as CSV
   */
  @Get('ideas/csv')
  @Header('Content-Type', 'text/csv')
  async exportIdeasCSV(@CurrentUser() user: any, @Res() res: Response) {
    const csv = await this.exportService.exportIdeasCSV(user.id);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ideas-export-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  /**
   * Export planner as JSON
   */
  @Get('planner')
  async exportPlanner(@CurrentUser() user: any, @Res() res: Response) {
    const data = await this.exportService.exportPlanner(user.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="planner-export-${Date.now()}.json"`,
    );
    res.json(data);
  }

  /**
   * Export calendar as JSON
   */
  @Get('calendar')
  async exportCalendar(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const data = await this.exportService.exportCalendar(user.id, start, end);
    if (res) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="calendar-export-${Date.now()}.json"`,
      );
      res.json(data);
    }
    return data;
  }

  /**
   * Export workspace as JSON
   */
  @Get('workspace/:teamId')
  async exportWorkspace(
    @CurrentUser() user: any,
    @Param('teamId') teamId: string,
    @Res() res: Response,
  ) {
    const data = await this.exportService.exportWorkspace(teamId, user.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="workspace-export-${Date.now()}.json"`,
    );
    res.json(data);
  }

  /**
   * Import ideas from CSV
   */
  @Post('ideas/import')
  async importIdeas(
    @CurrentUser() user: any,
    @Body('csvContent') csvContent: string,
  ) {
    return this.importService.importIdeasFromCSV(user.id, csvContent);
  }
}
