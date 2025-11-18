import { PartialType } from '@nestjs/mapped-types';
import { CreateIdeaDto } from './create-idea.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateIdeaDto extends PartialType(CreateIdeaDto) {
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

