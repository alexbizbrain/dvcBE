export class LinkedUserDto {
  id!: string;
  email?: string | null;
  phoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export class LiabilityClaimResponseDto {
  id!: string;
  email?: string | null;
  phoneNumber?: string | null;
  countryCode!: string;
  atFaultDriver!: boolean;
  state!: string;
  hitAndRun!: boolean;
  agreeToEmails!: boolean;
  agreeToSms!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  user?: LinkedUserDto | null;
}

export class PaginatedLiabilityClaimsResponseDto {
  items!: LiabilityClaimResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

export class LiabilityClaimCountsDto {
  totalClaims!: number;
  atFaultDrivers!: number;
  emailSubscribers!: number;
  smsSubscribers!: number;
}
