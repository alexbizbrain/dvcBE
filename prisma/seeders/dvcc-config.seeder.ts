import type { PrismaClient } from '@prisma/client';

export class DvccConfigSeeder {
  async run(prisma: PrismaClient) {
    const existing = await prisma.dVCCConfiguration.findFirst();
    if (existing) {
      return;
    }

    await prisma.dVCCConfiguration.create({
      data: {
        id: 'singleton-dvcc-config',
        minApproxCarPrice: 0,
        maxApproxCarPrice: 1000000,
        minApproxCarPriceActive: false,
        maxApproxCarPriceActive: false,
        minTotalRepairCost: null,
        minTotalRepairCostActive: false,
        maxTotalRepairCost: null,
        maxTotalRepairCostActive: false,
        contingencyPlanPercentage: null,
      },
    });
  }
}
