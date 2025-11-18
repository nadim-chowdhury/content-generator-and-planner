import { IsString, IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['MEMBER', 'ADMIN'])
  role: string;
}

