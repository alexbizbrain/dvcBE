import { IsOptional, IsString, IsIn } from 'class-validator';

export class AccidentInfoDto {
  @IsOptional()
  @IsString()
  accidentDate?: string;

  @IsOptional()
  @IsIn(['yes', 'no'])
  isAtFault?: string;

  @IsOptional()
  @IsIn(['yes', 'no'])
  isRepaired?: string;

  @IsOptional()
  @IsString()
  repairCost?: string;

  @IsOptional()
  @IsString()
  approximateCarPrice?: string;

  @IsOptional()
  @IsString()
  nextAction?: string;
}