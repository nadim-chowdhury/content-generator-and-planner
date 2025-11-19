import { IsString, IsIn } from 'class-validator';
// import { TeamRole } from '@prisma/client';
type TeamRole = 'VIEWER' | 'EDITOR' | 'MANAGER' | 'ADMIN';

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN'])
  role: TeamRole;
}
