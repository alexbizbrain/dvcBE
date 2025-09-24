import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CalculatorProgressService } from 'src/calculator-progress/calculator-progress.service';
import { GetClaimsQueryDto } from './dto/claims-query.dto';
import { Prisma, ClaimStatus } from '@prisma/client';

@Injectable()
export class UserDashboardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly _calculatorProgressService: CalculatorProgressService,
  ) {}

  async listForUser(userId: string, q: GetClaimsQueryDto) {
    const { status, sortBy, sortOrder, page = 1, limit = 10 } = q;

    const where: Prisma.ClaimWhereInput = {
      userId,
      ...(status?.length ? { status: { in: status as ClaimStatus[] } } : {}),
    };

    const orderBy: Prisma.ClaimOrderByWithRelationInput =
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : { createdAt: 'desc' };

    const skip = (page - 1) * limit;
    const take = limit;

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.claim.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prismaService.claim.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        sortBy,
        sortOrder,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        filters: {
          status: status ?? null,
        },
      },
      success: true,
    };
  }
}
