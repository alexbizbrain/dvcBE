export type SafeUser = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  firstName: string | null;
  lastName: string | null;
  address: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isBusinessUser: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  roleId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
