import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { AdminReviewsService } from 'src/admin/reviews/admin-reviews.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, PrismaService, AdminReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
