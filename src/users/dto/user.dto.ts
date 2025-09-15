import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class UserDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsPhoneNumber() phoneNumber?: string;

  @IsOptional() @IsString() @MaxLength(6) countryCode?: string;

  @IsOptional() @IsString() @MaxLength(80) firstName?: string;
  @IsOptional() @IsString() @MaxLength(80) lastName?: string;

  @IsOptional() @IsBoolean() isBusinessUser?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
