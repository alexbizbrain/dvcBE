import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateDvccConfigDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minApproxCarPrice?: number;

  @IsOptional()
  @IsBoolean()
  minApproxCarPriceActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minTotalRepairCost?: number;

  @IsOptional()
  @IsBoolean()
  minTotalRepairCostActive?: boolean;


  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  contingencyPlanPercentage?: number; // 0-100
}

export type DvccConfigResponse = {
  id: string;
  minApproxCarPrice: string; // Prisma Decimal serialized
  minApproxCarPriceActive: boolean;
  minTotalRepairCost: string | null;
  minTotalRepairCostActive: boolean;
  contingencyPlanPercentage: string | null; // decimal(5,2)
  createdAt: string;
  updatedAt: string;
};
