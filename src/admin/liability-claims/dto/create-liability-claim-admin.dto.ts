import { IsString, IsBoolean, IsOptional, IsIn } from 'class-validator';

export class CreateLiabilityClaimAdminDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(['us'])
  countryCode?: string;

  @IsBoolean()
  atFaultDriver: boolean;

  @IsString()
  state: string;

  @IsOptional()
  @IsBoolean()
  hitAndRun?: boolean;

  @IsOptional()
  @IsBoolean()
  agreeToEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  agreeToSms?: boolean;
}
