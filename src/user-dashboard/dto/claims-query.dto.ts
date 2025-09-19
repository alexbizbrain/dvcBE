import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetClaimsQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value?.split(',')?.map(String),
  )
  @IsString({ each: true })
  status?: string[]; // e.g. ?status=draft,completed

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
