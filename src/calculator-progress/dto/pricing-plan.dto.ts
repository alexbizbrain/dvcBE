import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class PricingPlanDto {
  @IsOptional()
  @IsString()
  selectedPlan?: string;

  @IsOptional()
  @IsBoolean()
  agreedToTerms?: boolean;

  @IsOptional()
  @IsString()
  signatureDataUrl?: string;
}
