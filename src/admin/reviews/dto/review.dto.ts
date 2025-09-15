import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class ReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  customerInitials?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
