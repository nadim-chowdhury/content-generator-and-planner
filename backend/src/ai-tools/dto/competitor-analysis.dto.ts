import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CompetitorAnalysisDto {
  @IsString()
  @IsNotEmpty()
  niche: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  competitors?: string[]; // Competitor usernames/handles

  @IsString()
  @IsOptional()
  platform?: string; // Specific platform to analyze

  @IsString()
  @IsOptional()
  language?: string; // Language code (default: 'en')
}



