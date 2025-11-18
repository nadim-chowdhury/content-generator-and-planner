import { IsEnum, IsNotEmpty } from 'class-validator';
import { PlanType } from './create-checkout.dto';

export class UpgradeDowngradeDto {
  @IsEnum(PlanType)
  @IsNotEmpty()
  planType: PlanType;
}

