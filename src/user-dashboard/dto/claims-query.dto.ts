import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PageQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 10;

  // Keyset pagination (cursor) — opaque string from the previous response
  @IsOptional()
  @IsString()
  cursor?: string;
}

export enum UiStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class ClaimsQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(UiStatus)
  status?: UiStatus;

  // Free-text search over denormalized columns (see indexing notes below)
  @IsOptional()
  @IsString()
  q?: string;

  // Optional: limit search width to reduce DB pressure
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  searchLimit: number = 50;
}
