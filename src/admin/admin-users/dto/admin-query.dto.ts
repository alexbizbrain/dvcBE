import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}
