import { IsArray, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum BulkOperation {
  DELETE = 'DELETE',
  ARCHIVE = 'ARCHIVE',
  UNARCHIVE = 'UNARCHIVE',
  MOVE = 'MOVE',
  EXPORT = 'EXPORT',
}

export class BulkOperationsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  ideaIds: string[];

  @IsEnum(BulkOperation)
  operation: BulkOperation;

  @IsString()
  @IsOptional()
  folderId?: string; // For MOVE operation

  @IsString()
  @IsOptional()
  exportFormat?: string; // 'csv', 'json', 'pdf', 'text', 'google_sheets', 'notion' for EXPORT operation

  @IsString()
  @IsOptional()
  googleSheetsId?: string; // For Google Sheets export

  @IsString()
  @IsOptional()
  notionDatabaseId?: string; // For Notion export
}

