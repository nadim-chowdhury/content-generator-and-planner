import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { ConnectPlatformDto } from './dto/connect-platform.dto';
import { ConnectFacebookPageDto } from './dto/facebook-pages.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SocialPlatform } from './dto/connect-platform.dto';

@Controller('api/social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('connect')
  async connect(@CurrentUser() user: any, @Body() dto: ConnectPlatformDto) {
    return this.socialService.connectPlatform(user.id, dto);
  }

  @Get('connections')
  async getConnections(
    @CurrentUser() user: any,
    @Query('platform') platform?: SocialPlatform,
  ) {
    return this.socialService.getConnections(user.id, platform);
  }

  @Get('facebook/pages')
  async getFacebookPages(@CurrentUser() user: any) {
    return this.socialService.getFacebookPages(user.id);
  }

  @Post('facebook/fetch-pages')
  async fetchFacebookPages(
    @CurrentUser() user: any,
    @Body('userAccessToken') userAccessToken: string,
  ) {
    return this.socialService.fetchFacebookPages(userAccessToken);
  }

  @Post('facebook/connect-page')
  async connectFacebookPage(
    @CurrentUser() user: any,
    @Body() dto: ConnectFacebookPageDto,
  ) {
    return this.socialService.connectFacebookPage(user.id, dto);
  }

  @Delete('disconnect/:connectionId')
  async disconnect(
    @CurrentUser() user: any,
    @Param('connectionId') connectionId: string,
  ) {
    return this.socialService.disconnectPlatform(user.id, connectionId);
  }

  @Post('set-default/:connectionId')
  async setDefault(
    @CurrentUser() user: any,
    @Param('connectionId') connectionId: string,
  ) {
    return this.socialService.setDefaultConnection(user.id, connectionId);
  }

  @Post('post/:ideaId/:connectionId')
  async postToPlatform(
    @CurrentUser() user: any,
    @Param('ideaId') ideaId: string,
    @Param('connectionId') connectionId: string,
    @Body() content: { caption?: string; hashtags?: string[] },
  ) {
    return this.socialService.postToPlatform(user.id, ideaId, connectionId, content);
  }
}

