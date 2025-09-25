import { IsOptional, IsObject } from 'class-validator';

export class MergeClaimJsonDto {
  @IsOptional()
  @IsObject()
  vehicleInfo?: Record<string, any>;

  @IsOptional()
  @IsObject()
  accidentInfo?: Record<string, any>;

  @IsOptional()
  @IsObject()
  insuranceInfo?: Record<string, any>;

  @IsOptional()
  @IsObject()
  pricingPlan?: Record<string, any>;

  @IsOptional()
  @IsObject()
  liabilityInfo?: Record<string, any>;
}
