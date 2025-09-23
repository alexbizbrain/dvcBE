// src/admin/reviews/admin-reviews.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { AdminReviewsService } from './admin-reviews.service';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly adminReviewsService: AdminReviewsService) {}

  @Get('metrics')
  async metrics() {
    const data = await this.adminReviewsService.metrics();
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: ReviewQueryDto) {
    const data = await this.adminReviewsService.findAll(query);
    return { success: true, message: 'Reviews retrieved', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.adminReviewsService.findOne(id);
    return { statusCode: HttpStatus.OK, message: 'Review retrieved', data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    const data = await this.adminReviewsService.update(id, dto);
    return { statusCode: HttpStatus.OK, message: 'Review updated', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const result = await this.adminReviewsService.remove(id);
    return { statusCode: HttpStatus.OK, message: result.message };
  }
}
