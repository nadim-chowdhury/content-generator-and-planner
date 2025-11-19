import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
// import { SocialPlatform } from '@prisma/client';
type SocialPlatform =
  | 'FACEBOOK'
  | 'TWITTER'
  | 'INSTAGRAM'
  | 'THREADS'
  | 'LINKEDIN'
  | 'REDDIT'
  | 'QUORA'
  | 'PINTEREST'
  | 'TIKTOK'
  | 'YOUTUBE';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsString()
  language?: string; // ISO 639-1 code

  @IsOptional()
  @IsString()
  timezone?: string; // IANA timezone

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['12h', '24h'])
  timeFormat?: '12h' | '24h';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredPlatforms?: string[];

  @IsOptional()
  contentTemplates?: any; // JSON object

  @IsOptional()
  @IsString()
  @IsEnum(['professional', 'casual', 'friendly', 'formal', 'creative'])
  aiTone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'creative';

  @IsOptional()
  @IsString()
  @IsEnum(['balanced', 'concise', 'detailed', 'engaging'])
  aiStyle?: 'balanced' | 'concise' | 'detailed' | 'engaging';

  @IsOptional()
  @IsString()
  aiPersonality?: string;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(2000)
  aiMaxLength?: number;

  @IsOptional()
  @IsBoolean()
  aiIncludeHashtags?: boolean;

  @IsOptional()
  @IsBoolean()
  aiIncludeEmojis?: boolean;

  @IsOptional()
  @IsString()
  @IsEnum(['light', 'dark', 'auto'])
  theme?: 'light' | 'dark' | 'auto';
}
