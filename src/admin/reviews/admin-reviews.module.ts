import { Module } from '@nestjs/common';
import { AdminReviewsService } from './admin-reviews.service';
import { AdminReviewsController } from './admin-reviews.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AdminReviewsController],
  providers: [AdminReviewsService, PrismaService],
  exports: [AdminReviewsService],
})
export class AdminReviewsModule {}
