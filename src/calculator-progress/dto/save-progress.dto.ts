import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleInfoDto } from './vehicle-info.dto';
import { AccidentInfoDto } from './accident-info.dto';
import { InsuranceInfoDto } from './insurance-info.dto';
import { PricingPlanDto } from './pricing-plan.dto';

export class SaveProgressDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  currentStep?: number;

  @IsOptional()
  @IsBoolean()
  isSubmitted?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleInfoDto)
  vehicleInfo?: VehicleInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccidentInfoDto)
  accidentInfo?: AccidentInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceInfoDto)
  insuranceInfo?: InsuranceInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PricingPlanDto)
  pricingPlan?: PricingPlanDto;
}
