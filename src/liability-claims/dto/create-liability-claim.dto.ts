import { IsString, IsBoolean, IsOptional, IsIn } from 'class-validator';

export class CreateLiabilityClaimDto {
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

  @IsString()
  @IsIn(['yes', 'no'])
  atFaultDriver: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsBoolean()
  agreeToEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  agreeToSms?: boolean;
}