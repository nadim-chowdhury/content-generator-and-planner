import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { WorkspaceService } from './services/workspace.service';
import { TeamActivityService } from './services/team-activity.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlansGuard } from '../auth/guards/plans.guard';
import { Plans } from '../auth/decorators/plans.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/teams')
@UseGuards(JwtAuthGuard, PlansGuard)
@Plans('AGENCY')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly workspaceService: WorkspaceService,
    private readonly teamActivityService: TeamActivityService,
  ) {}

  @Post()
  async createTeam(
    @CurrentUser() user: any,
    @Body() createTeamDto: CreateTeamDto,
  ) {
    return this.teamsService.createTeam(user.id, createTeamDto.name);
  }

  @Get()
  async getUserTeams(@CurrentUser() user: any) {
    return this.teamsService.getUserTeams(user.id);
  }

  @Get(':teamId')
  async getTeam(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.getTeam(teamId, user.id);
  }

  @Put(':teamId')
  async updateTeam(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(teamId, user.id, updateTeamDto.name);
  }

  @Delete(':teamId')
  async deleteTeam(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.deleteTeam(teamId, user.id);
  }

  @Post(':teamId/members')
  async inviteMember(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.teamsService.inviteMember(
      teamId,
      user.id,
      inviteMemberDto.email,
      inviteMemberDto.role || 'EDITOR',
    );
  }

  @Delete(':teamId/members/:memberId')
  async removeMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.removeMember(teamId, user.id, memberId);
  }

  @Put(':teamId/members/:memberId/role')
  async updateMemberRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(
      teamId,
      user.id,
      memberId,
      updateRoleDto.role,
    );
  }

  @Post(':teamId/leave')
  async leaveTeam(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.leaveTeam(teamId, user.id);
  }

  // Workspace endpoints
  @Post('workspace/switch')
  async switchWorkspace(
    @CurrentUser() user: any,
    @Body('workspaceId') workspaceId: string,
  ) {
    return this.workspaceService.switchWorkspace(user.id, workspaceId);
  }

  @Get('workspace/current')
  async getCurrentWorkspace(@CurrentUser() user: any) {
    return this.workspaceService.getCurrentWorkspace(user.id);
  }

  @Post('workspace/clear')
  async clearWorkspace(@CurrentUser() user: any) {
    return this.workspaceService.clearWorkspace(user.id);
  }

  // Team activities
  @Get(':teamId/activities')
  async getTeamActivities(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    // Verify user has access
    await this.teamsService.getTeam(teamId, user.id);
    return this.teamActivityService.getTeamActivities(teamId);
  }
}


