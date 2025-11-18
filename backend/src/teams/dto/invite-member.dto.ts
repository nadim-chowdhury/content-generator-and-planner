import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsIn(['MEMBER', 'ADMIN'])
  role?: string;
}

