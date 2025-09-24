import { IsOptional, IsString, IsIn, isString } from 'class-validator';

export class LiabilityInfoDto {
  @IsOptional()
  isAtFault?: boolean;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  accidentState?: string;
}
