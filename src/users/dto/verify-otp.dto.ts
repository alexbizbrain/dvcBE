import { IsEmail, IsOptional, IsPhoneNumber, Length } from 'class-validator';

export class VerifyOtpDto {
  @Length(6, 6)
  otp!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;
}
