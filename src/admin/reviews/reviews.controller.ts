// src/reviews/reviews.controller.ts (Public endpoint for frontend)
import { Controller, Get, Query } from '@nestjs/common';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { AdminReviewsService } from './admin-reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly adminReviewsService: AdminReviewsService) {}

  @Get()
  async getPublicReviews(
    @Query() query: { limit?: number; source?: string; rating?: number },
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      reviews: ReviewResponseDto[];
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
      rating: query.rating,
    };

    const result = await this.adminReviewsService.findAllReviews(queryDto);
    const stats = await this.adminReviewsService.getReviewStats();

    return {
      success: true,
      message: 'Reviews retrieved successfully',
      data: {
        reviews: result.reviews,
        stats: {
          averageRating: stats.averageRating,
          totalReviews: stats.total,
        },
      },
    };
  }

  @Get('latest')
  async getLatestReviews(): Promise<{
    success: boolean;
    message: string;
    data: ReviewResponseDto[];
  }> {
    const queryDto: ReviewQueryDto = {
      limit: 6,
      page: 1,
    };

    const result = await this.adminReviewsService.findAllReviews(queryDto);

    return {
      success: true,
      message: 'Latest reviews retrieved successfully',
      data: result.reviews,
    };
  }
}
