import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RescheduleIdeaDto {
  @IsString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsOptional()
  reason?: string; // Reason for rescheduling
}
