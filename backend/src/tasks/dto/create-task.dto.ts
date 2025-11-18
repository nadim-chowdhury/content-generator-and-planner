import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsInt, Min, Max } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  viralScore?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

