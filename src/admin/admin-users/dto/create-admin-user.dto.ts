import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class CreateAdminUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString() // add your own phone regex if you want
  phoneNumber?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  // at least one of email or phoneNumber
  @ValidateIf((o) => !o.email && !o.phoneNumber)
  get _emailOrPhoneRequired(): never {
    throw new Error('Either email or phoneNumber is required');
  }
}
