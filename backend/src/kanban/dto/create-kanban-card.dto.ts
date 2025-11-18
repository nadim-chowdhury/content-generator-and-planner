import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';

export enum KanbanStage {
  IDEAS = 'IDEAS',
  DRAFTING = 'DRAFTING',
  EDITING = 'EDITING',
  READY = 'READY',
  SCHEDULED = 'SCHEDULED',
  POSTED = 'POSTED',
}

export class CreateKanbanCardDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(KanbanStage)
  @IsOptional()
  stage?: KanbanStage;

  @IsString()
  @IsOptional()
  ideaId?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignedTo?: string[];
}


