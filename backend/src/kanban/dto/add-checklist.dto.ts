import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class AddChecklistDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsOptional()
  items?: Array<{ id: string; text: string; completed: boolean }>;
}

