import { IsString, IsInt, IsBoolean, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @MaxLength(100)
  customerName: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  customerInitials?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(1000)
  reviewText: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string = 'Website';

  // @IsOptional()
  // @IsBoolean()
  // isVerified?: boolean = false;

  // @IsOptional()
  // @IsBoolean()
  // isActive?: boolean = true;

  // @IsOptional()
  // @IsBoolean()
  // isFeatured?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
