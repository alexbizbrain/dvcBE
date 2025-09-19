// src/admin/reviews/admin-reviews.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminReviewsService } from './admin-reviews.service';
import { ReviewDto } from './dto/review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import {
  ReviewResponseDto,
  PaginatedReviewsResponseDto,
} from './dto/review-response.dto';

@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly adminReviewsService: AdminReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReview(@Body() reviewDto: ReviewDto): Promise<{
    success: boolean;
    message: string;
    data: ReviewResponseDto;
  }> {
    const review = await this.adminReviewsService.createReview(reviewDto);
    return {
      success: true,
      message: 'Review created successfully',
      data: review,
    };
  }

  @Get()
  async findAllReviews(@Query() query: ReviewQueryDto): Promise<{
    success: boolean;
    message: string;
    data: PaginatedReviewsResponseDto;
  }> {
    const result = await this.adminReviewsService.findAllReviews(query);
    return {
      success: true,
      message: 'Reviews retrieved successfully',
      data: result,
    };
  }

  @Get('stats')
  async getReviewStats(): Promise<{
    success: boolean;
    message: string;
    data: {
      total: number;
      averageRating: number;
      ratingDistribution: { rating: number; count: number }[];
      sourceDistribution: { source: string; count: number }[];
    };
  }> {
    const stats = await this.adminReviewsService.getReviewStats();
    return {
      success: true,
      message: 'Review statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':id')
  async findOneReview(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: ReviewResponseDto;
  }> {
    const review = await this.adminReviewsService.findOneReview(id);
    return {
      success: true,
      message: 'Review retrieved successfully',
      data: review,
    };
  }

  @Patch(':id')
  async updateReview(
    @Param('id') id: string,
    @Body() reviewDto: ReviewDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: ReviewResponseDto;
  }> {
    const review = await this.adminReviewsService.updateReview(id, reviewDto);
    return {
      success: true,
      message: 'Review updated successfully',
      data: review,
    };
  }

  @Delete(':id')
  async deleteReview(@Param('id') id: string): Promise<any> {
    await this.adminReviewsService.deleteReview(id);
    return {
      success: true,
      message: 'Review updated successfully',
      data: {},
    };
  }
}
