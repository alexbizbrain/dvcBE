export class DvccConfigResponseDto {
  minApproxCarPrice: number;
  maxApproxCarPrice: number;
  minApproxCarPriceActive: boolean;
  maxApproxCarPriceActive: boolean;
  minTotalRepairCost: number | null;
  minTotalRepairCostActive: boolean;
  maxTotalRepairCost: number | null;
  maxTotalRepairCostActive: boolean;
  contingencyPlanPercentage: number | null;
}
