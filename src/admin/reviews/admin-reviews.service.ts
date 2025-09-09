// src/admin/reviews/admin-reviews.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewResponseDto, PaginatedReviewsResponseDto } from './dto/review-response.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(createReviewDto: CreateReviewDto): Promise<ReviewResponseDto> {
    try {
      // Generate initials if not provided
      if (!createReviewDto.customerInitials && createReviewDto.customerName) {
        createReviewDto.customerInitials = this.generateInitials(createReviewDto.customerName);
      }

      const review = await this.prisma.review.create({
        data: createReviewDto,
      });

      return this.mapToResponseDto(review);
    } catch (error) {
      console.log(error)
      throw new BadRequestException('Failed to create review');
    }
  }

  async findAllReviews(query: ReviewQueryDto): Promise<PaginatedReviewsResponseDto> {
    const { page = 1, limit = 10, search, source, rating } = query;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { reviewText: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (source) {
      where.source = { contains: source, mode: 'insensitive' };
    }

    if (rating) {
      where.rating = rating;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' }
        ],
      }),
      this.prisma.review.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      reviews: reviews.map(review => this.mapToResponseDto(review)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOneReview(id: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.mapToResponseDto(review);
  }

  async updateReview(id: string, updateReviewDto: UpdateReviewDto): Promise<ReviewResponseDto> {
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    try {
      // Generate initials if customerName is being updated and initials not provided
      if (updateReviewDto.customerName && !updateReviewDto.customerInitials) {
        updateReviewDto.customerInitials = this.generateInitials(updateReviewDto.customerName);
      }

      const updatedReview = await this.prisma.review.update({
        where: { id },
        data: updateReviewDto,
      });

      return this.mapToResponseDto(updatedReview);
    } catch (error) {
      throw new BadRequestException('Failed to update review');
    }
  }

  async deleteReview(id: string): Promise<void> {
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({
      where: { id },
    });
  }

  async getReviewStats(): Promise<{
    total: number;
    averageRating: number;
    ratingDistribution: { rating: number; count: number }[];
    sourceDistribution: { source: string; count: number }[];
  }> {
    const [total, ratings, sources] = await Promise.all([
      this.prisma.review.count(),
      this.prisma.review.findMany({
        select: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['source'],
        _count: { source: true },
      }),
    ]);

    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratings.filter(r => r.rating === rating).length,
    }));

    const sourceDistribution = sources.map(s => ({
      source: s.source,
      count: s._count.source,
    }));

    return {
      total,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      sourceDistribution,
    };
  }

  private generateInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  private mapToResponseDto(review: any): ReviewResponseDto {
    return {
      id: review.id,
      customerName: review.customerName,
      customerInitials: review.customerInitials,
      rating: review.rating,
      reviewText: review.reviewText,
      source: review.source,
      displayOrder: review.displayOrder,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}