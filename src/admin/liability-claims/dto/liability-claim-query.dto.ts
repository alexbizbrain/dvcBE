import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsISO8601,
  IsBooleanString,
} from 'class-validator';

export class LiabilityClaimQueryDto {
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

  /** search by email, state, or phone */
  @IsOptional()
  @IsString()
  q?: string;

  /** exact state filter */
  @IsOptional()
  @IsString()
  state?: string;

  /** "true" | "false" */
  @IsOptional()
  @IsBooleanString()
  atFaultDriver?: string;

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;
}
