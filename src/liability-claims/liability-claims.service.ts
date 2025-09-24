import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UsersService } from 'src/users/users.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EnsureUserResult } from './types/liability-claim.type';
import { ListLiabilityClaimDto } from './dto/list-liability-claim.dto';
import { CreateLiabilityClaimDto } from './dto/create-liability-claim.dto';
import { UpdateLiabilityClaimDto } from './dto/update-liability-claim.dto';

type OtpNotify = { channel: 'email' | 'phone'; contact: string; code: string };

@Injectable()
export class LiabilityClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) { }

  private async ensureUserTx(
    tx: Prisma.TransactionClient,
    email?: string,
    phoneNumber?: string,
    countryCode?: string,
  ): Promise<EnsureUserResult> {
    if (!email && !phoneNumber) return { id: null, existed: false };

    if (email) {
      const u = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (u) return { id: u.id, existed: true };
    }

    if (phoneNumber) {
      const u = await tx.user.findUnique({
        where: { phoneNumber },
        select: { id: true },
      });
      if (u) return { id: u.id, existed: true };
    }

    const created = await tx.user.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        countryCode: countryCode ?? '+1',
        isActive: true,
        role: { connect: { name: 'USER' } },
      },
      select: { id: true },
    });
    return { id: created.id, existed: false };
  }

  async create(dto: CreateLiabilityClaimDto) {
    try {
      const countryCode = dto.countryCode ?? 'us';

      const { ensuredUser, claim, otp } = await this.prisma.$transaction(
        async (tx) => {
          const ensuredUser = await this.ensureUserTx(
            tx,
            dto.email,
            dto.phoneNumber,
            countryCode,
          );

          const claim = await tx.liabilityClaim.create({
            data: {
              email: dto.email ?? null,
              phoneNumber: dto.phoneNumber ?? null,
              countryCode:
                typeof countryCode === 'string'
                  ? countryCode.toLowerCase()
                  : countryCode,
              atFaultDriver: dto.atFaultDriver,
              state: dto.state,
              agreeToEmails: dto.agreeToEmails ?? false,
              agreeToSms: dto.agreeToSms ?? false,
              user: { connect: { id: ensuredUser.id! } },
            },
          });

          let channel: 'email' | 'phone' | null = null;
          let contact: string | null = null;
          if (dto.email) {
            channel = 'email';
            contact = dto.email;
          } else if (dto.phoneNumber) {
            channel = 'phone';
            contact = dto.phoneNumber;
          }

          if (!channel && ensuredUser.id) {
            const u = await tx.user.findUnique({
              where: { id: ensuredUser.id },
              select: { email: true, phoneNumber: true },
            });
            if (u?.email) {
              channel = 'email';
              contact = u.email;
            } else if (u?.phoneNumber) {
              channel = 'phone';
              contact = u.phoneNumber;
            }
          }

          let otp: OtpNotify | null = null;

          if (ensuredUser.id && channel && contact) {
            const { code } = await this.usersService.issueOtpTx(
              tx,
              ensuredUser.id,
              channel,
            );
            otp = { channel, contact, code };
          }

          return { ensuredUser, claim, otp };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      if (otp) {
        await this.usersService.notifyOtp(otp.channel, otp.contact, otp.code);
      }

      return {
        claim,
        user: ensuredUser.id
          ? { id: ensuredUser.id, existed: ensuredUser.existed }
          : null,
        developmentOtp:
          process.env.NODE_ENV === 'development' && otp ? otp.code : undefined,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async list({
    page = 1,
    limit = 10,
    q,
    state,
    countryCode,
    atFaultDriver,
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
