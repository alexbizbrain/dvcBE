import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleInfoDto } from './vehicle-info.dto';
import { AccidentInfoDto } from './accident-info.dto';
import { InsuranceInfoDto } from './insurance-info.dto';
import { PricingPlanDto } from './pricing-plan.dto';
import { LiabilityInfoDto } from './liability-info.dto';
import { ClaimStatus } from '../enums/claim-status.enum';

export class SaveProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  currentStep?: number;

  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @IsOptional()
  @IsBoolean()
  isSubmitted?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => LiabilityInfoDto)
  liabilityInfo?: LiabilityInfoDto;

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
