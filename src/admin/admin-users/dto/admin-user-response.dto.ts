export class AdminUserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  countryCode?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  role: {
    id: string;
    name: string;
  };
}

export interface PaginatedAdminUsersResponseDto {
  users: AdminUserResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
