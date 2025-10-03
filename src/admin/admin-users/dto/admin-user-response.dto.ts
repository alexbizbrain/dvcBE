export class RoleLiteDto {
  id!: string;
  name!: string;
}

export class AdminUserResponseDto {
  id!: string;
  email?: string | null;
  phoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  isActive!: boolean;
  isEmailVerified!: boolean;
  isPhoneVerified!: boolean;
  isBusinessUser!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  role!: RoleLiteDto;
}

export class PaginatedAdminUsersResponseDto {
  users!: AdminUserResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
