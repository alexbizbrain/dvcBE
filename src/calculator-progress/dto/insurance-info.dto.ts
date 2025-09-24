import { IsOptional, IsString } from 'class-validator';

export class InsuranceInfoDto {
  @IsOptional()
  @IsString()
  yourInsurance?: string;

  @IsOptional()
  @IsString()
  claimNumber?: string;

  @IsOptional()
  @IsString()
  atFaultInsurance?: string;

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
