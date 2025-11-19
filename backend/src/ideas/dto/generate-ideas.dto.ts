import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class GenerateIdeasDto {
  @IsString()
  @IsNotEmpty()
  niche: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'YouTube',
    'YouTube Shorts',
    'TikTok',
    'Instagram Reels',
    'Facebook Reels',
    'Twitter',
    'LinkedIn',
    'Instagram',
    'Facebook',
    'Threads',
    'Pinterest',
    'Reddit',
    'Quora',
  ])
  platform: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'motivational',
    'humorous',
    'educational',
    'entertaining',
    'inspirational',
    'casual',
    'professional',
    'trendy',
  ])
  tone: string;

  @IsInt()
  @Min(10)
  @Max(30)
  @IsOptional()
  count?: number; // Number of ideas to generate (10-30, default: 10)

  @IsString()
  @IsOptional()
  contentLength?: string;

  @IsString()
  @IsOptional()
  contentFrequency?: string;

  @IsString()
  @IsOptional()
  additionalContext?: string; // Additional context or requirements

  @IsString()
  @IsOptional()
  @IsIn([
    'en',
    'bn',
    'hi',
    'ar',
    'es',
    'fr',
    'de',
    'pt',
    'ru',
    'ja',
    'ko',
    'zh',
    'it',
    'tr',
    'vi',
    'th',
    'id',
    'nl',
    'pl',
    'uk',
  ])
  language?: string; // Language code (default: 'en')
}
