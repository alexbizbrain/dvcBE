import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { HealthService } from './health.service';
import { ClaimStatus } from '@prisma/client';

type RecentActivity = {
  type: 'user' | 'claim' | 'customer-query' | 'review' | 'liability-claim';
  id: string;
  title: string;
  createdAt: string;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly healthService: HealthService,
  ) {}

  async getOverview() {
    const [totalUsers, totalClaims, totalCustomerQueries] = await Promise.all([
      this.prismaService.user.count(),
      this.prismaService.claim.count(),
      this.prismaService.customerQuery.count(),
    ]);

    const monthlyRevenue = 100000;

    const recent = await this.prismaService.$queryRawUnsafe<RecentActivity[]>(`
      SELECT 'user' AS type, u."id", COALESCE(u."email", u."phoneNumber", 'New user') AS title, u."createdAt"
      FROM "users" u
      UNION ALL
      SELECT 'claim' AS type, c."id", CONCAT('Claim • ', c."status") AS title, c."createdAt"
      FROM "claims" c
      UNION ALL
      SELECT 'customer_query' AS type, q."id", q."email" AS title, q."createdAt"
      FROM "customer_queries" q
      UNION ALL
      SELECT 'liability_claim' AS type, l."id", COALESCE(l."email", l."phoneNumber", 'Liability claim') AS title, l."createdAt"
      FROM "liability_claims" l
      UNION ALL
      SELECT 'review' AS type, r."id", CONCAT('Review • ', r."rating", '/5') AS title, r."createdAt"
      FROM "reviews" r
      ORDER BY "createdAt" DESC
      LIMIT 4
      `);

    const [claimsInProgress, newCustomerQueriesToday, uptimePct] =
      await Promise.all([
        this.prismaService.claim.count({
          where: {
            status: {
              in: [ClaimStatus.INPROGRESS],
            },
          },
        }),
        this.prismaService.customerQuery.count({
          where: {
            createdAt: {
              gte: new Date(new Date().toISOString().slice(0, 10)),
            },
          },
        }),
        this.healthService.getUptimePercentage(),
      ]);

    return {
      totals: {
        users: totalUsers,
        claims: totalClaims,
        customerQueries: totalCustomerQueries,
        monthlyRevenue,
        currency: 'USD',
      },
      recentActivity: recent.map((r) => ({
        ...r,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
      systemStatus: {
        claimsInProgress,
        newCustomerQueriesToday,
        systemUptimePercentage: uptimePct,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
