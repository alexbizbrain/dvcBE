import { IsObject } from 'class-validator';

export class PatchLiabilityInfoDto {
  @IsObject()
  liabilityInfo!: Record<string, any>;
}
