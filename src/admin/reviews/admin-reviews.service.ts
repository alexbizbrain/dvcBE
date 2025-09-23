// src/admin/reviews/admin-reviews.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import {
  PaginatedReviewsDto,
  ReviewItemDto,
  ReviewMetricsDto,
} from './dto/review-response.dto';
import { Prisma } from '@prisma/client';
import { ReviewQueryDto } from './dto/review-query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class AdminReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private select() {
    return {
      id: true,
      customerName: true,
      customerInitials: true,
      rating: true,
      reviewText: true,
      source: true,
      displayOrder: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private toItem(r: any): ReviewItemDto {
    return r;
  }

  async metrics(): Promise<ReviewMetricsDto> {
    const [agg, fiveStarCount, topSourceRow] = await Promise.all([
      this.prisma.review.aggregate({
        _count: { _all: true },
        _avg: { rating: true },
      }),
      this.prisma.review.count({ where: { rating: 5 } }),
      this.prisma.review
        .groupBy({
          by: ['source'],
          _count: { source: true },
          orderBy: { _count: { source: 'desc' } },
          take: 1,
        })
        .catch(() => []),
    ]);

    return {
      totalReviews: agg._count._all ?? 0,
      averageRating: Number((agg._avg.rating ?? 0).toFixed(2)),
      fiveStarCount,
      topSource: topSourceRow[0]?.source ?? null,
    };
  }

  async findAll(query: ReviewQueryDto): Promise<PaginatedReviewsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      ...(query.q
        ? {
            OR: [
              { customerName: { contains: query.q, mode: 'insensitive' } },
              { reviewText: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.source ? { source: { equals: query.source } } : {}),
      ...(query.minRating || query.maxRating
        ? {
            rating: {
              ...(query.minRating ? { gte: query.minRating } : {}),
              ...(query.maxRating ? { lte: query.maxRating } : {}),
            },
          }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          // show curated items first if you use displayOrder; then newest
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        select: this.select(),
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toItem(r)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: string): Promise<ReviewItemDto> {
    const r = await this.prisma.review.findUnique({
      where: { id },
      select: this.select(),
    });
    if (!r) throw new NotFoundException('Review not found');
    return this.toItem(r);
  }

  async update(id: string, dto: UpdateReviewDto): Promise<ReviewItemDto> {
    await this.ensureExists(id);
    const r = await this.prisma.review.update({
      where: { id },
      data: {
        customerName: dto.customerName ?? undefined,
        customerInitials: dto.customerInitials ?? undefined,
        rating: dto.rating ?? undefined,
        reviewText: dto.reviewText ?? undefined,
        source: dto.source ?? undefined,
        displayOrder: dto.displayOrder ?? undefined,
      },
      select: this.select(),
    });
    return this.toItem(r);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.ensureExists(id);
    await this.prisma.review.delete({ where: { id } });
    return { message: 'Review deleted successfully' };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Review not found');
  }
}
