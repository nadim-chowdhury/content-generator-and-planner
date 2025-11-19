import { IsString, IsOptional } from 'class-validator';

export class DuplicateIdeaDto {
  @IsString()
  @IsOptional()
  newTitle?: string; // Optional new title for the duplicate

  @IsString()
  @IsOptional()
  folderId?: string; // Optional folder to place duplicate in
}



