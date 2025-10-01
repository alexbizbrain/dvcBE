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
        minApproxCarPriceActive: false,
        minTotalRepairCost: null,
        minTotalRepairCostActive: false,
        contingencyPlanPercentage: null,
      },
    });
  }
}
