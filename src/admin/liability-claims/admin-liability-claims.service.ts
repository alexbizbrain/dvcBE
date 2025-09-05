import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { QueryLiabilityClaimsDto } from './dto/query-liability-claims.dto';
import { CreateLiabilityClaimAdminDto } from './dto/create-liability-claim-admin.dto';
import { UpdateLiabilityClaimDto } from './dto/update-liability-claim.dto';
import { Prisma } from '@prisma/client';

export interface PaginatedLiabilityClaims {
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
export class AdminLiabilityClaimsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateLiabilityClaimAdminDto) {
    try {
      // Validate that either email or phone is provided
      if (!createDto.email && !createDto.phoneNumber) {
        throw new BadRequestException(
          'Either email or phone number is required',
        );
      }

      const claim = await this.prisma.liabilityClaim.create({
        data: {
          email: createDto.email,
          phoneNumber: createDto.phoneNumber,
          countryCode: createDto.countryCode || 'us',
          atFaultDriver: createDto.atFaultDriver,
          state: createDto.state,
          agreeToEmails: createDto.agreeToEmails || false,
          agreeToSms: createDto.agreeToSms || false,
        },
      });

      return {
        success: true,
        message: 'Liability claim created successfully',
        data: claim,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create liability claim',
      );
    }
  }

  async findAll(
    queryDto: QueryLiabilityClaimsDto,
  ): Promise<PaginatedLiabilityClaims> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        email,
        state,
        countryCode,
        atFaultDriver,
      } = queryDto;
      const skip = (page - 1) * limit;

      // Build where clause for search functionality
      const whereClause: Prisma.LiabilityClaimWhereInput = {};

      if (search) {
        whereClause.OR = [
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            phoneNumber: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            state: {
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

      if (state) {
        whereClause.state = {
          contains: state,
          mode: 'insensitive',
        };
      }

      if (countryCode) {
        whereClause.countryCode = countryCode;
      }

      if (atFaultDriver !== undefined) {
        whereClause.atFaultDriver = atFaultDriver;
      }

      // Get total count for pagination
      const total = await this.prisma.liabilityClaim.count({
        where: whereClause,
      });

      // Get paginated results
      const claims = await this.prisma.liabilityClaim.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          countryCode: true,
          atFaultDriver: true,
          state: true,
          agreeToEmails: true,
          agreeToSms: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: claims,
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
        'Failed to retrieve liability claims',
      );
    }
  }

  async findOne(id: string) {
    try {
      const claim = await this.prisma.liabilityClaim.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          countryCode: true,
          atFaultDriver: true,
          state: true,
          agreeToEmails: true,
          agreeToSms: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!claim) {
        throw new NotFoundException('Liability claim not found');
      }

      return {
        success: true,
        data: claim,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve liability claim',
      );
    }
  }

  async update(id: string, updateDto: UpdateLiabilityClaimDto) {
    try {
      const existingClaim = await this.prisma.liabilityClaim.findUnique({
        where: { id },
      });

      if (!existingClaim) {
        throw new NotFoundException('Liability claim not found');
      }

      // Validate that either email or phone is provided after update
      const updatedEmail =
        updateDto.email !== undefined ? updateDto.email : existingClaim.email;
      const updatedPhone =
        updateDto.phoneNumber !== undefined
          ? updateDto.phoneNumber
          : existingClaim.phoneNumber;

      if (!updatedEmail && !updatedPhone) {
        throw new BadRequestException(
          'Either email or phone number is required',
        );
      }

      const updatedClaim = await this.prisma.liabilityClaim.update({
        where: { id },
        data: updateDto,
      });

      return {
        success: true,
        message: 'Liability claim updated successfully',
        data: updatedClaim,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update liability claim',
      );
    }
  }

  async remove(id: string) {
    try {
      const claim = await this.prisma.liabilityClaim.findUnique({
        where: { id },
      });

      if (!claim) {
        throw new NotFoundException('Liability claim not found');
      }

      await this.prisma.liabilityClaim.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Liability claim deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to delete liability claim',
      );
    }
  }
}
