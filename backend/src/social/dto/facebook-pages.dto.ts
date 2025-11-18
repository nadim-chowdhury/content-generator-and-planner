import { IsString, IsOptional } from 'class-validator';

export class ConnectFacebookPageDto {
  @IsString()
  pageId: string;

  @IsString()
  pageAccessToken: string;

  @IsString()
  @IsOptional()
  pageName?: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  userAccessToken: string; // User's access token to get pages
}

