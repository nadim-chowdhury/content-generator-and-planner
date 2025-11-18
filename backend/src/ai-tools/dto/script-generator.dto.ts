import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

export enum ScriptType {
  SHORT = 'SHORT', // 15-60 seconds
  LONG = 'LONG',   // 5+ minutes
}

export class ScriptGeneratorDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsEnum(ScriptType)
  type: ScriptType;

  @IsString()
  @IsOptional()
  tone?: string; // motivational, humorous, educational, etc.

  @IsString()
  @IsOptional()
  platform?: string; // TikTok, YouTube, Instagram Reels, etc.

  @IsInt()
  @Min(15)
  @Max(3600)
  @IsOptional()
  targetDuration?: number; // in seconds

  @IsString()
  @IsOptional()
  language?: string; // Language code (default: 'en')

  @IsString()
  @IsOptional()
  additionalContext?: string;
}


