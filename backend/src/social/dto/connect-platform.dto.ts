import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';

export enum SocialPlatform {
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  INSTAGRAM = 'INSTAGRAM',
  THREADS = 'THREADS',
  LINKEDIN = 'LINKEDIN',
  REDDIT = 'REDDIT',
  QUORA = 'QUORA',
  PINTEREST = 'PINTEREST',
  TIKTOK = 'TIKTOK',
  YOUTUBE = 'YOUTUBE',
}

export class ConnectPlatformDto {
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @IsString()
  accessToken: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsString()
  @IsOptional()
  platformUserId?: string;

  @IsString()
  @IsOptional()
  platformUsername?: string;

  // For Facebook pages
  @IsString()
  @IsOptional()
  pageId?: string;

  @IsString()
  @IsOptional()
  pageName?: string;

  // Account label/name
  @IsString()
  @IsOptional()
  accountName?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
