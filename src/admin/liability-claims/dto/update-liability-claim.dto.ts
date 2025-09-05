import { IsString, IsBoolean, IsOptional, IsIn } from 'class-validator';

export class UpdateLiabilityClaimDto {
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

  @IsOptional()
  @IsBoolean()
  atFaultDriver?: boolean;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsBoolean()
  agreeToEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  agreeToSms?: boolean;
}
