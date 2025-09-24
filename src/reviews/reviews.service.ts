import { Injectable, Query } from '@nestjs/common';
import { AdminReviewsService } from 'src/admin/reviews/admin-reviews.service';
import { ReviewQueryDto } from 'src/admin/reviews/dto/review-query.dto';
import { PaginatedReviewsDto } from 'src/admin/reviews/dto/review-response.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminReviewsService: AdminReviewsService,
  ) {}

  async getPublicReviews(
    @Query() query: { limit?: number; source?: string; rating?: number },
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      reviews: PaginatedReviewsDto;
      stats: {
        averageRating: number;
        totalReviews: number;
      };
    };
  }> {
    const limit = query.limit || 10;
    const queryDto: ReviewQueryDto = {
      limit,
      page: 1,
      source: query.source,
      minRating: query.rating,
      maxRating: query.rating,
    };

    const result = await this.adminReviewsService.findAll(queryDto);
    const stats = await this.adminReviewsService.metrics();

    return {
      success: true,
      message: 'Reviews retrieved successfully',
      data: {
        reviews: result,
        stats: {
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
        },
      },
    };
  }
}
