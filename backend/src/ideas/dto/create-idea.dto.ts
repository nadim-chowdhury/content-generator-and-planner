import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt, Min, Max } from 'class-validator';

export class CreateIdeaDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  script?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  niche: string;

  @IsString()
  @IsNotEmpty()
  tone: string;

  @IsInt()
  @Min(0)
  @Max(3600)
  @IsOptional()
  duration?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  viralScore?: number;
}

