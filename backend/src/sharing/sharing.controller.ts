import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { SharingService } from './sharing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/sharing')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Get('idea/:ideaId/image')
  async getIdeaImage(@Param('ideaId') ideaId: string, @Res() res: Response) {
    try {
      const imageBuffer = await this.sharingService.generateIdeaImage(ideaId);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="idea-${ideaId}.png"`,
      );
      res.send(imageBuffer);
    } catch (error) {
      res.status(404).json({ message: 'Idea not found' });
    }
  }

  @Post('content-card')
  @UseGuards(JwtAuthGuard)
  async generateContentCard(
    @CurrentUser() user: any,
    @Body()
    data: {
      title: string;
      content: string;
      platform?: string;
      author?: string;
    },
    @Res() res: Response,
  ) {
    try {
      const imageBuffer = await this.sharingService.generateContentCard({
        ...data,
        author: data.author || user.name || user.email,
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="content-card.png"',
      );
      res.send(imageBuffer);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate image' });
    }
  }
}
