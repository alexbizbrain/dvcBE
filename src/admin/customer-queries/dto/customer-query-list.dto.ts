// src/admin/customer-queries/dto/customer-query-list.dto.ts
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsISO8601,
} from 'class-validator';

export class CustomerQueryListDto {
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

  /** search by name (first/last), email, or message content */
  @IsOptional()
  @IsString()
  q?: string;

  /** optional date window */
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;
}
