export class ReviewResponseDto {
  id: string;
  customerName: string;
  customerInitials?: string;
  rating: number;
  reviewText: string;
  source: string;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedReviewsResponseDto {
  reviews: ReviewResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}