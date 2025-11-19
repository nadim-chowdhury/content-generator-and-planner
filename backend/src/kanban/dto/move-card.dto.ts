import { IsString, IsNotEmpty, IsEnum, IsInt, IsOptional } from 'class-validator';
import { KanbanStage } from './create-kanban-card.dto';

export class MoveCardDto {
  @IsEnum(KanbanStage)
  @IsNotEmpty()
  targetStage: KanbanStage;

  @IsInt()
  @IsOptional()
  targetPosition?: number;
}



