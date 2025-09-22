import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsISO8601,
  IsBooleanString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => Number(value))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  // optional filters
  @IsOptional()
  @IsBooleanString()
  isActive?: string; // "true" | "false"

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;
}
