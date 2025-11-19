import { IsEnum, IsString, IsOptional } from 'class-validator';

export enum PlanType {
  PRO_MONTHLY = 'PRO_MONTHLY',
  PRO_YEARLY = 'PRO_YEARLY',
  AGENCY = 'AGENCY',
}

export class CreateCheckoutDto {
  @IsEnum(PlanType)
  planType: PlanType;
}



