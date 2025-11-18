import { IsString, IsOptional, IsInt, IsDateString, IsEnum } from 'class-validator';

export enum AnalyticsSource {
  MANUAL = 'MANUAL',
  API = 'API',
  PREDICTED = 'PREDICTED',
}

export class CreateAnalyticsDto {
  @IsString()
  @IsOptional()
  ideaId?: string;

  @IsString()
  platform: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  niche?: string;

  @IsInt()
  @IsOptional()
  reach?: number;

  @IsInt()
  @IsOptional()
  impressions?: number;

  @IsInt()
  @IsOptional()
  engagement?: number;

  @IsInt()
  @IsOptional()
  likes?: number;

  @IsInt()
  @IsOptional()
  comments?: number;

  @IsInt()
  @IsOptional()
  shares?: number;

  @IsInt()
  @IsOptional()
  views?: number;

  @IsInt()
  @IsOptional()
  clicks?: number;

  @IsInt()
  @IsOptional()
  saves?: number;

  @IsDateString()
  @IsOptional()
  postedAt?: string;

  @IsEnum(AnalyticsSource)
  @IsOptional()
  source?: AnalyticsSource;

  @IsString()
  @IsOptional()
  notes?: string;
}

