import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class TrendingTopicsDto {
  @IsString()
  @IsNotEmpty()
  niche: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsInt()
  @Min(5)
  @Max(30)
  @IsOptional()
  count?: number; // Number of trending topics (default: 10)

  @IsString()
  @IsOptional()
  language?: string; // Language code (default: 'en')

  @IsString()
  @IsOptional()
  timeFrame?: string; // 'daily', 'weekly', 'monthly'
}


