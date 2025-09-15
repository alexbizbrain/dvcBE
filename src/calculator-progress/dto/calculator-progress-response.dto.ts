import { AccidentInfoDto } from "./accident-info.dto";
import { InsuranceInfoDto } from "./insurance-info.dto";
import { PricingPlanDto } from "./pricing-plan.dto";
import { VehicleInfoDto } from "./vehicle-info.dto";

export class CalculatorProgressResponseDto {
  id: string;
  currentStep: number;
  isSubmitted: boolean;
  lastAccessedAt: Date;
  vehicleInfo: VehicleInfoDto;
  accidentInfo: AccidentInfoDto;
  insuranceInfo: InsuranceInfoDto;
  pricingPlan: PricingPlanDto;
  createdAt: Date;
  updatedAt: Date;
}