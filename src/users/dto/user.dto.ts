export class UserDto {
  id?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isBusinessUser?: boolean;
  isActive?: boolean;
  lastLoginAt?: Date;
  roleId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}