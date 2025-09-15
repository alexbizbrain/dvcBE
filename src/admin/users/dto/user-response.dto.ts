export class UserResponseDto {
  id: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isBusinessUser: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  role: {
    id: string;
    name: string;
  };
}

export class PaginatedUsersResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
