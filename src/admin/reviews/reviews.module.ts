import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { AdminReviewsService } from './admin-reviews.service';
import { PrismaService } from 'src/prisma.service';
// import { ReviewsController } from './reviews.controller';
// import { AdminReviewsService } from '../admin/reviews/admin-reviews.service';
// import { ReviewsController } from './admin-reviews.controller';
// import { AdminReviewsService } from './admin-reviews.service';

@Module({
  controllers: [ReviewsController],
  providers: [AdminReviewsService, PrismaService],
})
export class ReviewsModule {}