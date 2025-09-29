import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateDvccConfigDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minApproxCarPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxApproxCarPrice?: number;

  @IsOptional()
  @IsBoolean()
  minApproxCarPriceActive?: boolean;

  @IsOptional()
  @IsBoolean()
  maxApproxCarPriceActive?: boolean;

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
  maxTotalRepairCost?: number;

  @IsOptional()
  @IsBoolean()
  maxTotalRepairCostActive?: boolean;

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
  maxApproxCarPrice: string;
  minApproxCarPriceActive: boolean;
  maxApproxCarPriceActive: boolean;
  minTotalRepairCost: string | null;
  minTotalRepairCostActive: boolean;
  maxTotalRepairCost: string | null;
  maxTotalRepairCostActive: boolean;
  contingencyPlanPercentage: string | null; // decimal(5,2)
  createdAt: string;
  updatedAt: string;
};
