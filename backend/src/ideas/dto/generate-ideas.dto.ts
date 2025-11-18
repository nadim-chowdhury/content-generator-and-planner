import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class GenerateIdeasDto {
  @IsString()
  @IsNotEmpty()
  niche: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['TikTok', 'YouTube', 'Instagram', 'Twitter', 'Facebook', 'LinkedIn'])
  platform: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['motivational', 'humorous', 'educational', 'entertaining', 'inspirational', 'casual'])
  tone: string;

  @IsString()
  @IsOptional()
  contentLength?: string;

  @IsString()
  @IsOptional()
  contentFrequency?: string;
}

