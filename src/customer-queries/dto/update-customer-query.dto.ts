import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCustomerQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(6)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;
}
