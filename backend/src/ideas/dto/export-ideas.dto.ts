import { IsArray, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
  TEXT = 'text',
  GOOGLE_SHEETS = 'google_sheets',
  NOTION = 'notion',
}

export class ExportIdeasDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  ideaIds: string[];

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsString()
  @IsOptional()
  googleSheetsId?: string; // For Google Sheets export

  @IsString()
  @IsOptional()
  notionDatabaseId?: string; // For Notion export
}


