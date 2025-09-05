import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { QueryCustomerQueriesDto } from './dto/query-customer-queries.dto';
import { Prisma } from '@prisma/client';

export interface PaginatedCustomerQueries {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class AdminCustomerQueriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    queryDto: QueryCustomerQueriesDto,
  ): Promise<PaginatedCustomerQueries> {
    try {
      const { page = 1, limit = 10, search, email, name } = queryDto;
      const skip = (page - 1) * limit;

      // Build where clause for search functionality
      const whereClause: Prisma.CustomerQueryWhereInput = {};

      if (search) {
        whereClause.OR = [
          {
            firstName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      if (email) {
        whereClause.email = {
          contains: email,
          mode: 'insensitive',
        };
      }

      if (name) {
        whereClause.OR = [
          {
            firstName: {
              contains: name,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: name,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Get total count for pagination
      const total = await this.prisma.customerQuery.count({
        where: whereClause,
      });

      // Get paginated results
      const queries = await this.prisma.customerQuery.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          countryCode: true,
          message: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: queries,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve customer queries',
      );
    }
  }

  async findOne(id: string) {
    try {
      const query = await this.prisma.customerQuery.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          countryCode: true,
          message: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!query) {
        throw new NotFoundException('Customer query not found');
      }

      return {
        success: true,
        data: query,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve customer query',
      );
    }
  }

  async remove(id: string) {
    try {
      const query = await this.prisma.customerQuery.findUnique({
        where: { id },
      });

      if (!query) {
        throw new NotFoundException('Customer query not found');
      }

      await this.prisma.customerQuery.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Customer query deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete customer query');
    }
  }
}
