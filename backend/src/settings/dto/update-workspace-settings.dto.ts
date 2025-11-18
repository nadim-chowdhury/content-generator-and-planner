import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateWorkspaceSettingsDto {
  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsObject()
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };

  @IsOptional()
  @IsString()
  brandLogo?: string;

  @IsOptional()
  @IsString()
  brandFont?: string;

  @IsOptional()
  @IsObject()
  defaultPostingSchedule?: {
    days?: string[]; // ['monday', 'tuesday', etc.]
    times?: string[]; // ['09:00', '14:00', etc.]
  };

  @IsOptional()
  @IsString()
  defaultTimeZone?: string;

  @IsOptional()
  @IsBoolean()
  allowViewersToComment?: boolean;

  @IsOptional()
  @IsBoolean()
  allowEditorsToSchedule?: boolean;

  @IsOptional()
  @IsBoolean()
  allowEditorsToPublish?: boolean;

  @IsOptional()
  @IsBoolean()
  requireApprovalForPublishing?: boolean;

  @IsOptional()
  @IsString()
  contentGuidelines?: string;

  @IsOptional()
  @IsString()
  hashtagPolicy?: string;

  @IsOptional()
  @IsBoolean()
  autoScheduleEnabled?: boolean;
}

