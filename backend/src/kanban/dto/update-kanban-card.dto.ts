import { PartialType } from '@nestjs/mapped-types';
import { CreateKanbanCardDto } from './create-kanban-card.dto';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateKanbanCardDto extends PartialType(CreateKanbanCardDto) {
  @IsInt()
  @IsOptional()
  position?: number;
}
