// src/admin/reviews/dto/review-response.dto.ts
export class ReviewItemDto {
  id!: string;
  customerName!: string;
  customerInitials?: string | null;
  rating!: number;
  reviewText!: string;
  source!: string;
  displayOrder?: number | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class PaginatedReviewsDto {
  items!: ReviewItemDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

export class ReviewMetricsDto {
  totalReviews!: number;
  averageRating!: number; // 0..5 with 2 decimals
  fiveStarCount!: number;
  topSource!: string | null; // null when no data
}
