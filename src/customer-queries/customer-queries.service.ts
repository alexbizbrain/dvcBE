import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCustomerQueryDto } from './dto/create-customer-query.dto';
import { PrismaService } from '../prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class CustomerQueriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerQueryDto: CreateCustomerQueryDto) {
    try {
      // Ensure countryCode has a default value if not provided
      const data = {
        ...createCustomerQueryDto,
        countryCode: createCustomerQueryDto.countryCode || '+1',
      };

      const customerQuery = await this.prisma.customerQuery.create({
        data,
      });

      return {
        success: true,
        message: 'Customer query created successfully',
        data: customerQuery,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Failed to create customer query: ' + error.message,
        );
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the customer query',
      );
    }
  }

  async findAll() {
    try {
      const queries = await this.prisma.customerQuery.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: queries,
        count: queries.length,
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
      });

      if (!query) {
        throw new NotFoundException(`Customer query with ID ${id} not found`);
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
}
