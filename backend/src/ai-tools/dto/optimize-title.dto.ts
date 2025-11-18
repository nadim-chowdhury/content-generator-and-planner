import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class OptimizeTitleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  niche?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  variations?: number; // Number of title variations to generate (default: 5)

  @IsString()
  @IsOptional()
  language?: string; // Language code (default: 'en')

  @IsString()
  @IsOptional()
  additionalContext?: string;
}


