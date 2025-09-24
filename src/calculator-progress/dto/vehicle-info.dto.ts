import { IsOptional, IsString } from 'class-validator';

export class VehicleInfoDto {
  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  mileage?: string;

  @IsOptional()
  @IsString()
  repairCost?: string;

  @IsOptional()
  @IsString()
  approximateCarPrice?: string;
}
