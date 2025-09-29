// insurance-company.dto.ts
import {
  IsEnum,
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  IsObject,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InsuranceTypeDto {
  AUTO = 'AUTO',
  COMMERCIAL_AUTO = 'COMMERCIAL_AUTO',
}

export class CreateInsuranceCompanyDto {
  @IsString() companyName!: string;
  @IsEmail() contactEmail!: string;
  @IsOptional() @IsString() naic?: string;
  @IsEnum(InsuranceTypeDto) insuranceType!: InsuranceTypeDto;
  @IsOptional() @IsUrl() websiteUrl?: string;
  @IsOptional() @IsObject() companyLicensed?: Record<string, any>;
  @IsOptional() @IsString() companyInformation?: string;
}

export class UpdateInsuranceCompanyDto {
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() naic?: string;
  @IsOptional() @IsEnum(InsuranceTypeDto) insuranceType?: InsuranceTypeDto;
  @IsOptional() @IsUrl() websiteUrl?: string;
  @IsOptional() @IsObject() companyLicensed?: Record<string, any>;
  @IsOptional() @IsString() companyInformation?: string;
}

export class ListInsuranceCompaniesQuery {
  // free text
  @IsOptional() @IsString() q?: string; // searches companyName, contactEmail, naic, websiteUrl, companyInformation

  // exact filters
  @IsOptional()
  @IsArray()
  @IsEnum(InsuranceTypeDto, { each: true })
  @Type(() => String)
  insuranceTypeIn?: InsuranceTypeDto[];

  @IsOptional() @IsString() name?: string; // exact
  @IsOptional() @IsString() nameContains?: string; // ilike
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() emailContains?: string;
  @IsOptional() @IsString() naic?: string;
  @IsOptional() @IsString() naicContains?: string;
  @IsOptional() @IsString() websiteContains?: string;

  // JSON filters (examples)
  @IsOptional() @IsString() licensedState?: string; // companyLicensed.licensedStates includes value
  @IsOptional() @IsString() licenseNumberEquals?: string; // companyLicensed.licenseNumber equals

  // date range
  @IsOptional() @IsDateString() createdFrom?: string;
  @IsOptional() @IsDateString() createdTo?: string;

  // sorting & paging
  @IsOptional() @IsString() sortBy?:
    | 'companyName'
    | 'createdAt'
    | 'updatedAt'
    | 'insuranceType'
    | 'naic';
  @IsOptional() @IsString() sortOrder?: 'asc' | 'desc';
  @IsOptional() @Type(() => Number) page?: number; // 1-based
  @IsOptional() @Type(() => Number) limit?: number; // default 20

  // cursor pagination (optional alternative)
  @IsOptional() @IsString() cursor?: string;
}
