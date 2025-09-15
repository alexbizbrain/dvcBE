import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSummary() {
    const [users, claims, queries] = await this.prismaService.$transaction([
      this.prismaService.user.count(),
      this.prismaService.liabilityClaim.count(),
      this.prismaService.customerQuery.count(),
    ]);
    return { users, liabilityClaims: claims, customerQueries: queries };
  }

  async getEligibilityStats() {
    const eligibleCount = await this.prismaService.liabilityClaim.count({
      where: {
        atFaultDriver: true,
        OR: [
          { state: { equals: 'New York', mode: 'insensitive' } },
          { state: { equals: 'North Carolina', mode: 'insensitive' } },
          { state: { equals: 'NY', mode: 'insensitive' } },
          { state: { equals: 'NC', mode: 'insensitive' } },
        ],
      },
    });
    const total = await this.prismaService.liabilityClaim.count();
    return { eligibleCount, total, ratio: total ? eligibleCount / total : 0 };
  }

  async latestActivity() {
    const [claims, queries, users] = await this.prismaService.$transaction([
      this.prismaService.liabilityClaim.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prismaService.customerQuery.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prismaService.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, email: true, createdAt: true },
      }),
    ]);
    return { claims, queries, users };
  }

  async criticalReport() {
    const byState = await this.prismaService.liabilityClaim.groupBy({
      by: ['state'],
      _count: { _all: true },
      where: { atFaultDriver: true },
    });
    return { byState };
  }
}
