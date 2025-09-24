import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  LiabilityClaimCountsDto,
  LiabilityClaimResponseDto,
  PaginatedLiabilityClaimsResponseDto,
} from './dto/liability-claim-response.dto';
import { LiabilityClaimQueryDto } from './dto/liability-claim-query.dto';
import { Prisma } from '@prisma/client';
import { CreateLiabilityClaimDto } from './dto/create-liability-claim-admin.dto';
import { UpdateLiabilityClaimDto } from './dto/update-liability-claim.dto';

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
  constructor(private prisma: PrismaService) { }

  private selectClaim() {
    return {
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
      user: {
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          firstName: true,
          lastName: true,
        },
      },
    } as const;
  }

  private toResponse(c: any): LiabilityClaimResponseDto {
    return c;
  }

  async findAll(
    query: LiabilityClaimQueryDto,
  ): Promise<PaginatedLiabilityClaimsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LiabilityClaimWhereInput = {
      ...(query.q
        ? {
          OR: [
            { email: { contains: query.q, mode: 'insensitive' } },
            { phoneNumber: { contains: query.q, mode: 'insensitive' } },
            { state: { contains: query.q, mode: 'insensitive' } },
          ],
        }
        : {}),
      ...(query.state ? { state: { equals: query.state } } : {}),
      ...(query.atFaultDriver !== undefined
        ? { atFaultDriver: query.atFaultDriver === 'true' }
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

    const [items, total] = await Promise.all([
      this.prisma.liabilityClaim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.selectClaim(),
      }),
      this.prisma.liabilityClaim.count({ where }),
    ]);

    return {
      items: items.map((c) => this.toResponse(c)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async counts(): Promise<LiabilityClaimCountsDto> {
    const [totalClaims, atFaultDrivers, emailSubscribers, smsSubscribers] =
      await Promise.all([
        this.prisma.liabilityClaim.count(),
        this.prisma.liabilityClaim.count({ where: { atFaultDriver: true } }),
        this.prisma.liabilityClaim.count({ where: { agreeToEmails: true } }),
        this.prisma.liabilityClaim.count({ where: { agreeToSms: true } }),
      ]);

    return { totalClaims, atFaultDrivers, emailSubscribers, smsSubscribers };
  }

  async findOne(id: string): Promise<LiabilityClaimResponseDto> {
    const claim = await this.prisma.liabilityClaim.findUnique({
      where: { id },
      select: this.selectClaim(),
    });
    if (!claim) throw new NotFoundException('Liability claim not found');
    return this.toResponse(claim);
  }

  async create(
    dto: CreateLiabilityClaimDto,
  ): Promise<LiabilityClaimResponseDto> {
    const claim = await this.prisma.liabilityClaim.create({
      data: {
        email: dto.email?.trim(),
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode ?? 'us',
        atFaultDriver: dto.atFaultDriver,
        state: dto.state,
        agreeToEmails: dto.agreeToEmails ?? false,
        agreeToSms: dto.agreeToSms ?? false,
        userId: dto.userId!,
      },
      select: this.selectClaim(),
    });
    return this.toResponse(claim);
  }

  async update(
    id: string,
    dto: UpdateLiabilityClaimDto,
  ): Promise<LiabilityClaimResponseDto> {
    // ensure exists
    await this.ensureExists(id);

    const claim = await this.prisma.liabilityClaim.update({
      where: { id },
      data: {
        email: dto.email?.trim(),
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode,
        atFaultDriver: dto.atFaultDriver,
        state: dto.state,
        agreeToEmails: dto.agreeToEmails,
        agreeToSms: dto.agreeToSms,
        // link/unlink
        userId: dto.userId ?? undefined,
      },
      select: this.selectClaim(),
    });
    return this.toResponse(claim);
  }

  async remove(id: string): Promise<{ message: string }> {
    // hard delete (no soft flags in schema)
    await this.ensureExists(id);
    await this.prisma.liabilityClaim.delete({ where: { id } });
    return { message: 'Liability claim deleted successfully' };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.liabilityClaim.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Liability claim not found');
  }
}
