import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';

export class CalendarAutofillDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  niche: string;

  @IsString()
  @IsOptional()
  tone?: string;

  @IsInt()
  @Min(1)
  @Max(7)
  @IsOptional()
  postsPerWeek?: number; // Default: 3-5

  @IsString()
  @IsOptional()
  language?: string; // Language code (default: 'en')

  @IsString()
  @IsOptional()
  additionalContext?: string;
}



