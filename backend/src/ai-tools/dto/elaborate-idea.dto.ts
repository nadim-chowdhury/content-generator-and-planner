import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ElaborateIdeaDto {
  @IsString()
  @IsNotEmpty()
  idea: string; // Short idea or title

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  niche?: string;

  @IsString()
  @IsOptional()
  language?: string; // Language code (default: 'en')

  @IsString()
  @IsOptional()
  additionalContext?: string;
}
