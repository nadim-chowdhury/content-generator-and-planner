import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AudiencePersonaDto {
  @IsString()
  @IsNotEmpty()
  niche: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  language?: string; // Language code (default: 'en')

  @IsString()
  @IsOptional()
  additionalContext?: string;
}
