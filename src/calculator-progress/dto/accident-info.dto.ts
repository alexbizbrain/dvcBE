import { IsOptional, IsString, IsIn } from 'class-validator';

export class AccidentInfoDto {
  @IsOptional()
  @IsString()
  accidentDate?: string;

  @IsOptional()
  isAtFault?: boolean;

  @IsOptional()
  isRepaired?: boolean;

  @IsOptional()
  @IsString()
  repairCost?: string;

  @IsOptional()
  @IsString()
  approximateCarPrice?: string;

  @IsOptional()
  @IsString()
  repairInvoiceFileName?: string;

  @IsOptional()
  @IsString()
  repairInvoiceFileUrl?: string;

  @IsOptional()
  @IsString()
  nextAction?: string;
}
