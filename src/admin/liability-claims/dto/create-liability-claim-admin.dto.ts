import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateLiabilityClaimDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  countryCode?: string; // e.g. "+1" or "us" based on your current design

  @IsBoolean()
  atFaultDriver!: boolean;

  @IsString()
  state!: string;

  @IsOptional()
  @IsBoolean()
  agreeToEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  agreeToSms?: boolean;

  @IsOptional()
  @IsString()
  userId?: string; // optional link
}
