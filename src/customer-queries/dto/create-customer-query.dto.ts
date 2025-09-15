import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerQueryDto {
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsString()
  @MaxLength(6)
  countryCode!: string; // default handled at service/controller level if omitted

  @IsString()
  @MaxLength(5000)
  message!: string;
}
