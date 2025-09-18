import { IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class SendOtpDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('US')
  phoneNumber?: string;
}
