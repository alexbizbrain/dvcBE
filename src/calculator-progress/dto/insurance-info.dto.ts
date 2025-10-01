import { IsOptional, IsString, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { InsuranceCompanyDto } from './insurance-company.dto';

export class InsuranceInfoDto {
  // Contact Information (required fields)
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  claimNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceCompanyDto)
  atFaultInsurance?: InsuranceCompanyDto;

  @IsOptional()
  @IsString()
  adjusterName?: string;

  @IsOptional()
  @IsString()
  adjusterEmail?: string;

  @IsOptional()
  @IsString()
  adjusterPhone?: string;

  @IsOptional()
  @IsString()
  adjusterCountryCode?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  driverEmail?: string;

  @IsOptional()
  @IsString()
  driverPhone?: string;

  @IsOptional()
  @IsString()
  driverCountryCode?: string;

  @IsOptional()
  @IsString()
  autoInsuranceCardFileName?: string;

  @IsOptional()
  @IsString()
  autoInsuranceCardFileUrl?: string;

  @IsOptional()
  @IsString()
  driverLicenseFrontFileName?: string;

  @IsOptional()
  @IsString()
  driverLicenseFrontFileUrl?: string;

  @IsOptional()
  @IsString()
  driverLicenseBackFileName?: string;

  @IsOptional()
  @IsString()
  driverLicenseBackFileUrl?: string;
}
