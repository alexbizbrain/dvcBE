import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLiabilityClaimDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  countryCode?: string; // defaults to 'us' in service if omitted

  @IsString()
  atFaultDriver!: string;

  @IsString()
  @MaxLength(64)
  state!: string;

  @IsString()
  hitAndRun!: string;

  @IsOptional()
  @IsBoolean()
  agreeToEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  agreeToSms?: boolean;
}
