import { IsArray, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class MoveIdeasDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  ideaIds: string[];

  @IsString()
  @IsOptional()
  folderId?: string; // null to remove from folder
}


