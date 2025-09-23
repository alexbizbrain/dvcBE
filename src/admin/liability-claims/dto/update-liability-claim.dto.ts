import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateLiabilityClaimDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsBoolean()
  atFaultDriver?: boolean;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsBoolean()
  hitAndRun?: boolean;

  @IsOptional()
  @IsBoolean()
  agreeToEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  agreeToSms?: boolean;

  @IsOptional()
  @IsString()
  userId?: string | null; // allow unlink by passing null
}
