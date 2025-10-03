import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  countryCode?: string = '+1';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isBusinessUser?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
