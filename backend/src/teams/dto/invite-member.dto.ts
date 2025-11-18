import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';
// import { TeamRole } from '@prisma/client';
type TeamRole = 'VIEWER' | 'EDITOR' | 'MANAGER' | 'ADMIN';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsIn(['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN'])
  role?: TeamRole;
}
