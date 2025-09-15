import { IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class CheckUserExistsDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;
}
