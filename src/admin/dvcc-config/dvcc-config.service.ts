import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateDvccConfigDto } from './dto/dvcc-config.dto';

const SINGLETON_ID = 'singleton-dvcc-config';

@Injectable()
export class DvccConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<any> {
    const existing = await this.prisma.dVCCConfiguration.findFirst();
    if (existing) return existing;
    // Initialize defaults on first access
    return this.prisma.dVCCConfiguration.create({
      data: {
        id: SINGLETON_ID,
      },
    });
  }

  async update(dto: UpdateDvccConfigDto) {
    // Upsert with fixed id to enforce singleton
    const data: any = {};
    if (dto.minApproxCarPrice != null)
      data.minApproxCarPrice = dto.minApproxCarPrice;
    if (dto.maxApproxCarPrice != null)
      data.maxApproxCarPrice = dto.maxApproxCarPrice;
    if (dto.minApproxCarPriceActive != null)
      data.minApproxCarPriceActive = dto.minApproxCarPriceActive;
    if (dto.maxApproxCarPriceActive != null)
      data.maxApproxCarPriceActive = dto.maxApproxCarPriceActive;
    if (dto.minTotalRepairCost != null)
      data.minTotalRepairCost = dto.minTotalRepairCost;
    if (dto.minTotalRepairCostActive != null)
      data.minTotalRepairCostActive = dto.minTotalRepairCostActive;
    if (dto.maxTotalRepairCost != null)
      data.maxTotalRepairCost = dto.maxTotalRepairCost;
    if (dto.maxTotalRepairCostActive != null)
      data.maxTotalRepairCostActive = dto.maxTotalRepairCostActive;
    if (dto.contingencyPlanPercentage != null)
      data.contingencyPlanPercentage = dto.contingencyPlanPercentage;

    return this.prisma.dVCCConfiguration.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data },
      update: data,
    });
  }
}
