import { AccidentInfoDto } from './accident-info.dto';
import { InsuranceInfoDto } from './insurance-info.dto';
import { PricingPlanDto } from './pricing-plan.dto';
import { VehicleInfoDto } from './vehicle-info.dto';
import { LiabilityInfoDto } from './liability-info.dto';
import { ClaimStatus } from '../enums/claim-status.enum';

export class CalculatorProgressResponseDto {
  id: string;
  currentStep: number;
  isSubmitted: boolean;
  status: ClaimStatus;
  lastAccessedAt: Date;
  vehicleInfo: VehicleInfoDto;
  accidentInfo: AccidentInfoDto;
  insuranceInfo: InsuranceInfoDto;
  pricingPlan: PricingPlanDto;
  liabilityInfo: LiabilityInfoDto
  createdAt: Date;
  updatedAt: Date;
}
