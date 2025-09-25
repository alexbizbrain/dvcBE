import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerQueryDto } from './dto/create-customer-query.dto';
import { PrismaService } from '../prisma.service';
import { ListCustomerQueryDto } from './dto/list-customer-query.dto';
import { Prisma } from '@prisma/client';
import { UpdateCustomerQueryDto } from './dto/update-customer-query.dto';

@Injectable()
export class CustomerQueriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: string | undefined | null, dto: CreateCustomerQueryDto) {
    if (userId) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          countryCode: true,
        },
      });
      if (!user) throw new NotFoundException('User not found');

      const phoneNumber = dto.phoneNumber ?? user.phoneNumber ?? null;
      const countryCode = dto.countryCode ?? user.countryCode ?? '+1';

      return this.prismaService.customerQuery.create({
        data: {
          message: dto.message,
          firstName: user.firstName ?? dto.firstName ?? '',
          lastName: user.lastName ?? dto.lastName ?? '',
          email: user.email ?? dto.email ?? '',
          phoneNumber,
          countryCode,
          user: { connect: { id: user.id } },
        },
      });
    } else {
      return this.prismaService.customerQuery.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          countryCode: dto.countryCode ?? '+1',
          message: dto.message,
        },
      });
    }
  }

  async list({ page = 1, limit = 10, q }: ListCustomerQueryDto) {
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerQueryWhereInput = q
      ? {
          OR: [
            {
              firstName: {
                contains: q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              lastName: {
                contains: q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              email: {
                contains: q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              phoneNumber: {
                contains: q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.customerQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.customerQuery.count({
        where,
      }),
    ]);

    return {
      items,
      page,
      limit,
      total,
    };
  }

  async getById(id: string) {
    const found = await this.prismaService.customerQuery.findUnique({
      where: { id },
    });
    if (!found) throw new NotFoundException('Customer query not found');
    return found;
  }

  async update(id: string, dto: UpdateCustomerQueryDto) {
    try {
      return this.prismaService.customerQuery.update({
        where: { id },
        data: {
          ...(dto.firstName && { firstName: dto.firstName }),
          ...(dto.lastName && { lastName: dto.lastName }),
          ...(dto.email && { email: dto.email }),
          ...(dto.phoneNumber && { phoneNumber: dto.phoneNumber }),
          ...(dto.countryCode && { countryCode: dto.countryCode }),
          ...(dto.message && { message: dto.message }),
        },
      });
    } catch {
      throw new NotFoundException('Customer query not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prismaService.customerQuery.delete({
        where: { id },
      });
      return {
        id,
        deleted: true,
      };
    } catch {
      throw new NotFoundException('Customer query not found');
    }
  }
}
