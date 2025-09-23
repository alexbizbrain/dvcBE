import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerInitials?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  reviewText?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number | null;
}
