// src/admin/admin-users/dto/admin-query.dto.ts
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsBooleanString,
  IsISO8601,
} from 'class-validator';

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

  /** search by email, firstName, phoneNumber */
  @IsOptional()
  @IsString()
  search?: string;

  /** optional active filter: "true" | "false" */
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  /** "personal" (isBusinessUser=false) | "business" (isBusinessUser=true) */
  @IsOptional()
  @IsIn(['personal', 'business'])
  type?: 'personal' | 'business';
}
