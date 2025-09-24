import { ClaimStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsEnum,
  IsArray,
} from 'class-validator';

export class GetClaimsQueryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(ClaimStatus, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return undefined;
  })
  status?: ClaimStatus[];

  @IsOptional()
  @IsString()
  sortBy?: 'updatedAt' | 'createdAt' | 'lastAccessedAt' = 'updatedAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit: number = 10;
}
