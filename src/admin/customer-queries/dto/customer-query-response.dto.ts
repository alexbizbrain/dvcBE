export class CustomerQueryItemDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  phoneNumber?: string | null;
  countryCode!: string;
  message!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class PaginatedCustomerQueriesDto {
  items!: CustomerQueryItemDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

export class CustomerQueryCountDto {
  total!: number;
}
