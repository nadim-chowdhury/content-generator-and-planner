import { IsString, IsNotEmpty } from 'class-validator';

export class ActivateLifetimeDto {
  @IsString()
  @IsNotEmpty()
  licenseKey: string;
}

