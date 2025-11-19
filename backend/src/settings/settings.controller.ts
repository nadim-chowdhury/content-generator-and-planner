import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UpdateWorkspaceSettingsDto } from './dto/update-workspace-settings.dto';

@Controller('api/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get user settings
   */
  @Get('user')
  getUserSettings(@CurrentUser() user: any) {
    return this.settingsService.getUserSettings(user.id);
  }

  /**
   * Update user settings
   */
  @Put('user')
  updateUserSettings(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateUserSettingsDto,
  ) {
    return this.settingsService.updateUserSettings(user.id, updateDto);
  }

  /**
   * Get workspace settings
   */
  @Get('workspace/:teamId')
  getWorkspaceSettings(
    @CurrentUser() user: any,
    @Param('teamId') teamId: string,
  ) {
    return this.settingsService.getWorkspaceSettings(teamId, user.id);
  }

  /**
   * Update workspace settings
   */
  @Put('workspace/:teamId')
  updateWorkspaceSettings(
    @CurrentUser() user: any,
    @Param('teamId') teamId: string,
    @Body() updateDto: UpdateWorkspaceSettingsDto,
  ) {
    return this.settingsService.updateWorkspaceSettings(teamId, user.id, updateDto);
  }

  /**
   * Get AI settings (for use in AI generation)
   */
  @Get('ai')
  getAISettings(@CurrentUser() user: any) {
    return this.settingsService.getAISettings(user.id);
  }

  /**
   * Get preferred platforms
   */
  @Get('platforms')
  getPreferredPlatforms(@CurrentUser() user: any) {
    return this.settingsService.getPreferredPlatforms(user.id);
  }

  /**
   * Get workspace brand settings
   */
  @Get('workspace/:teamId/brand')
  getWorkspaceBrand(
    @CurrentUser() user: any,
    @Param('teamId') teamId: string,
  ) {
    return this.settingsService.getWorkspaceBrand(teamId, user.id);
  }
}


