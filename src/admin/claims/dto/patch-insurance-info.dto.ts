import { IsObject } from 'class-validator';

export class PatchInsuranceInfoDto {
  @IsObject()
  insuranceInfo!: Record<string, any>;
}
