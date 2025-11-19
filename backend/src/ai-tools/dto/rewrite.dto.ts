import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum RewriteStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  PROFESSIONAL = 'professional',
  CREATIVE = 'creative',
  CONCISE = 'concise',
  DETAILED = 'detailed',
}

export class RewriteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(RewriteStyle)
  @IsOptional()
  style?: RewriteStyle;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  language?: string; // Language code (default: 'en')

  @IsString()
  @IsOptional()
  additionalInstructions?: string;
}
