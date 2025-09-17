import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLiabilityClaimDto } from './dto/create-liability-claim.dto';
import { UsersService } from 'src/users/users.service';
import { EnsureUserResult } from './types/liability-claim.type';
import { ListLiabilityClaimDto } from './dto/list-liability-claim.dto';
import { Prisma } from '@prisma/client';
import { UpdateLiabilityClaimDto } from './dto/update-liability-claim.dto';

@Injectable()
export class LiabilityClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  private normalizeState(state: string) {
    return state.trim().toLowerCase();
  }

  private isNotAllowedState(state: string) {
    const s = this.normalizeState(state);
    return (
      s === 'new york' || s === 'north carolina' || s === 'ny' || s === 'nc'
    );
  }

  private async ensureUser(
    email?: string,
    phoneNumber?: string,
    countryCode?: string,
  ): Promise<EnsureUserResult> {
    if (!email && !phoneNumber) return { id: null, existed: false };

    const { exists, user } = await this.usersService.checkUserExists(
      email,
      phoneNumber,
    );
    if (exists && user) return { id: user.id, existed: true };

    const created = await this.usersService.createUser({
      email,
      phoneNumber,
      countryCode: countryCode,
      isActive: true,
    });
    return { id: created.id, existed: false };
  }

  private computeEligibility(
    atFaultDriver: string,
    hitAndRun: string,
    state: string,
  ) {
    const reasons: string[] = [];
    if (atFaultDriver !== 'no') reasons.push('atFaultDriver must be no');
    if (hitAndRun !== 'no') reasons.push('hitAndRun must be no');
    if (this.isNotAllowedState(state))
      reasons.push('state must be rather then New York or North Carolina');
    return { eligible: reasons.length === 0, reasons };
  }

  async create(dto: CreateLiabilityClaimDto) {
    try {
      const countryCode = (dto.countryCode ?? 'us').toLowerCase();
      const eligibility = this.computeEligibility(
        dto.atFaultDriver.toString(),
        dto.hitAndRun.toString(),
        dto.state,
      );
      const [ensuredUser, claim] = await this.prisma.$transaction(
        async (prisma) => {
          const ensuredUser = await this.ensureUser(
            dto.email,
            dto.phoneNumber,
            countryCode,
          );

          const claim = await prisma.liabilityClaim.create({
            data: {
              email: dto.email ?? null,
              countryCode,
              atFaultDriver: dto.atFaultDriver === 'no',
              state: dto.state,
              hitAndRun: dto.hitAndRun === 'no',
              agreeToEmails: dto.agreeToEmails ?? false,
              agreeToSms: dto.agreeToSms ?? false,
              user: { connect: { id: ensuredUser.id! } },
            },
          });

          return [ensuredUser, claim];
        },
      );

      return {
        claim,
        eligibility,
        user: { id: ensuredUser.id, existed: ensuredUser.existed },
      };
    } catch (error) {
      console.error(error);
    }
  }

  async list({
    page = 1,
    limit = 10,
    q,
    state,
    countryCode,
    atFaultDriver,
    hitAndRun,
    agreeToEmails,
    agreeToSms,
  }: ListLiabilityClaimDto) {
    const skip = (page - 1) * limit;
    const where: Prisma.LiabilityClaimWhereInput = {};
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (countryCode) where.countryCode = countryCode.toLowerCase();
    if (typeof atFaultDriver === 'boolean') where.atFaultDriver = atFaultDriver;
    if (typeof hitAndRun === 'boolean') where.hitAndRun = hitAndRun;
    if (typeof agreeToEmails === 'boolean') where.agreeToEmails = agreeToEmails;
    if (typeof agreeToSms === 'boolean') where.agreeToSms = agreeToSms;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.liabilityClaim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.liabilityClaim.count({ where }),
    ]);

    return { items, page, limit, total };
  }

  async getById(id: string) {
    const found = await this.prisma.liabilityClaim.findUnique({
      where: { id },
    });
    if (!found) throw new NotFoundException('Liability claim not found');
    return found;
  }

  async update(id: string, dto: UpdateLiabilityClaimDto) {
    try {
      return await this.prisma.liabilityClaim.update({
        where: { id },
        data: {
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          countryCode: dto.countryCode?.toLowerCase(),
          atFaultDriver: dto.atFaultDriver,
          state: dto.state,
          hitAndRun: dto.hitAndRun,
          agreeToEmails: dto.agreeToEmails,
          agreeToSms: dto.agreeToSms,
        },
      });
    } catch {
      throw new NotFoundException('Liability claim not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.liabilityClaim.delete({ where: { id } });
      return { id, deleted: true };
    } catch {
      throw new NotFoundException('Liability claim not found');
    }
  }
}
