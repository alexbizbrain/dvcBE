import { Controller, Get, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public } from 'src/common/auth/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  async getPublicReviews(
    @Query() query: { limit?: number; source?: string; rating?: number },
  ) {
    return this.reviewsService.getPublicReviews(query);
  }
}
