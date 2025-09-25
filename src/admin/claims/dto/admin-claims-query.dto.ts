import { ClaimStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AdminClaimsQueryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(ClaimStatus, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? [value]
        : undefined,
  )
  status?: ClaimStatus[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map(Number)
      : typeof value === 'string'
        ? [Number(value)]
        : undefined,
  )
  steps?: number[];

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsString()
  userPhone?: string;

  @IsOptional()
  @IsString()
  userName?: string; // matches either first or last name (contains, CI)

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  insurer?: string; // matches insuranceInfo.yourInsurance || atFaultInsurance (contains, CI)

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  isAtFault?: boolean; // liabilityInfo.isAtFault or accidentInfo.isAtFault

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  hitAndRun?: boolean; // accidentInfo.hitAndRun

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  hasDocuments?: boolean;

  @IsOptional()
  @IsString()
  search?: string; // free text across: claimNumber, adjuster, driverName, make/model

  @IsOptional()
  @IsString()
  sortBy?:
    | 'updatedAt'
    | 'createdAt'
    | 'lastAccessedAt'
    | 'status'
    | 'currentStep' = 'updatedAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  // date ranges (ISO strings)
  @IsOptional()
  @IsString()
  createdFrom?: string;

  @IsOptional()
  @IsString()
  createdTo?: string;

  @IsOptional()
  @IsString()
  updatedFrom?: string;

  @IsOptional()
  @IsString()
  updatedTo?: string;

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
