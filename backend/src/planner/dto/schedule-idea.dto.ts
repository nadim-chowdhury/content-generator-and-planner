import { IsDateString, IsNotEmpty } from 'class-validator';

export class ScheduleIdeaDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;
}
