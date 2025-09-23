import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';
import {
  CustomerQueryCountDto,
  CustomerQueryItemDto,
  PaginatedCustomerQueriesDto,
} from './dto/customer-query-response.dto';
import { CustomerQueryListDto } from './dto/customer-query-list.dto';

@Injectable()
export class AdminCustomerQueriesService {
  constructor(private prisma: PrismaService) {}

  private select() {
    return {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      countryCode: true,
      message: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private toItem(q: any): CustomerQueryItemDto {
    return q;
  }

  async findAll(
    query: CustomerQueryListDto,
  ): Promise<PaginatedCustomerQueriesDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerQueryWhereInput = {
      ...(query.q
        ? {
            OR: [
              { firstName: { contains: query.q, mode: 'insensitive' } },
              { lastName: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
              { message: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.customerQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.select(),
      }),
      this.prisma.customerQuery.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toItem(r)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async count(): Promise<CustomerQueryCountDto> {
    const total = await this.prisma.customerQuery.count();
    return { total };
  }

  async findOne(id: string): Promise<CustomerQueryItemDto> {
    const q = await this.prisma.customerQuery.findUnique({
      where: { id },
      select: this.select(),
    });
    if (!q) throw new NotFoundException('Customer query not found');
    return this.toItem(q);
  }

  async remove(id: string): Promise<{ message: string }> {
    // hard delete; if you want soft delete add a flag to schema
    await this.ensureExists(id);
    await this.prisma.customerQuery.delete({ where: { id } });
    return { message: 'Customer query deleted successfully' };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.customerQuery.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Customer query not found');
  }
}
