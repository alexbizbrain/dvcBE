import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserDto } from './dto/user.dto';
import { EmailService } from '../services/email.service';
import { SafeUser } from './types/user.type';
import { Prisma, User } from '@prisma/client';
import { randomInt } from 'crypto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { SmsService } from '../services/sms.service';
import { ConfigService } from '@nestjs/config';

interface GetInsuranceCompaniesParams {
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class UsersService {
  private readonly OTP_TTL_MIN = 2; // code lives 2 minutes
  private readonly OTP_MIN_INTERVAL_SEC = 60; // at least 60s between sends
  private readonly OTP_MAX_PER_WINDOW = 3; // max 3 sends...
  private readonly OTP_WINDOW_MIN = 2; // ...per 2 minutes
  private readonly LIMIT_PER_CHANNEL = false;

  constructor(
    private prismaService: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
    private configService: ConfigService,
  ) { }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      countryCode: user.countryCode,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isBusinessUser: user.isBusinessUser,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      roleId: user.roleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async checkUserExists(email?: string, phoneNumber?: string) {
    if (!email && !phoneNumber)
      throw new Error('Either email or phone number is required');
    const or: Prisma.UserWhereInput[] = [];
    if (email) or.push({ email });
    if (phoneNumber) or.push({ phoneNumber });

    const user = await this.prismaService.user.findFirst({
      where: { OR: or },
    });

    return {
      exists: !!user,
      user: user ? this.toSafeUser(user) : null,
    };
  }

  async createUser(userData: UserDto) {
    let userRole = await this.prismaService.role.findFirst({
      where: { name: 'USER' },
    });

    if (!userRole) {
      userRole = await this.prismaService.role.create({
        data: {
          name: 'USER',
          isActive: true,
        },
      });
    }

    const user = await this.prismaService.user.create({
      data: {
        ...userData,
        roleId: userRole.id,
      },
    });

    return this.toSafeUser(user);
  }

  async sendOtp(dto: SendOtpDto) {
    const { email, phoneNumber } = dto;
    if (!email && !phoneNumber) {
      throw new BadRequestException(
        'Either email or phone number must be provided',
      );
    }

    const or: Prisma.UserWhereInput[] = [];
    if (email) or.push({ email });
    if (phoneNumber) or.push({ phoneNumber });

    const user = await this.prismaService.user.findFirst({ where: { OR: or } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const channel: 'email' | 'phone' = email ? 'email' : 'phone';
    const contact = email ?? phoneNumber;

    const { code } = await this.prismaService.$transaction(
      (tx) => this.issueOtpTx(tx, user.id, channel, now),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await this.notifyOtp(channel, contact!, code);

    return {
      success: true,
      message: `OTP sent to ${contact}`,
      developmentOtp:
        this.configService.get('NODE_ENV') === 'development' ? code : undefined,
      ttlMinutes: 120,
    } as const;
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, phoneNumber, otp } = dto;
    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number must be provided');
    }

    const channel: 'email' | 'phone' = email ? 'email' : 'phone';
    const now = new Date();

    return this.prismaService.$transaction(
      async (tx) => {
        const or: Prisma.UserWhereInput[] = [];
        if (email) or.push({ email });
        if (phoneNumber) or.push({ phoneNumber });

        const user = await tx.user.findFirst({ where: { OR: or } });
        if (!user) throw new NotFoundException('User not found');

        const consume = await tx.otp.updateMany({
          where: {
            userId: user.id,
            code: otp,
            type: channel,
            isUsed: false,
            expiresAt: { gt: now },
          },
          data: { isUsed: true },
        });

        if (consume.count === 0)
          throw new NotFoundException('Invalid or expired OTP');

        const data: Prisma.UserUpdateInput = {};
        if (email) data.isEmailVerified = true;
        if (phoneNumber) data.isPhoneVerified = true;

        const updated = await tx.user.update({
          where: { id: user.id },
          data,
        });

        return {
          success: true,
          message: `${channel.toUpperCase()} verified`,
          userId: updated.id,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async getSafeUserById(id: string) {
    Logger.log('Getting user by id:', id);
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.toSafeUser(user);
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async logout(_id: string, _token: string) {
    return true;
  }

  async issueOtpTx(
    tx: Prisma.TransactionClient,
    userId: string,
    channel: 'email' | 'phone',
    now = new Date(),
  ): Promise<{ code: string; remainingInWindow: number }> {
    await tx.otp.updateMany({
      where: { userId, isUsed: false },
      data: { isUsed: true },
    });

    const code = this.generateOtp();

    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + TWO_HOURS_MS);

    await tx.otp.create({
      data: {
        code,
        type: channel,
        userId,
        expiresAt,
      },
    });

    return {
      code,
      remainingInWindow: -1,
    };
  }

  async notifyOtp(
    channel: 'email' | 'phone',
    contact: string,
    code: string,
  ): Promise<void> {
    if (channel === 'email') {
      const ok = await this.emailService.sendOtpEmail(contact, code);
      if (!ok) throw new BadRequestException('Failed to send OTP email');
      return;
    }
    const smsSent = await this.smsService.sendOtpSms(contact, code);
    if (!smsSent) throw new BadRequestException('Failed to send OTP SMS');
  }

  private generateOtp(): string {
    // cryptographically stronger 6-digit OTP
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  // async getInsuranceCompanies() {
  //   const insuranceCompanies = await this.prismaService.insuranceCompany.findMany({
  //     select: {
  //       id: true,
  //       companyName: true,
  //     },
  //     orderBy: {
  //       companyName: 'asc',
  //     },
  //   });

  //   return {
  //     success: true,
  //     data: insuranceCompanies,
  //   };
  // }
  async getInsuranceCompanies(params: GetInsuranceCompaniesParams = {}) {
    const { search, page = 1, limit = 50 } = params;

    // Calculate offset for pagination
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
        companyName: {
          contains: search,
          mode: 'insensitive' as const, // Case-insensitive search
        },
      }
      : {};

    // Execute queries in parallel for better performance
    const [companies, total] = await Promise.all([
      // Get paginated results
      this.prismaService.insuranceCompany.findMany({
        where,
        select: {
          id: true,
          companyName: true,
        },
        orderBy: {
          companyName: 'asc',
        },
        skip,
        take: limit,
      }),
      // Get total count
      this.prismaService.insuranceCompany.count({ where }),
    ]);

    // Calculate hasMore
    const hasMore = skip + companies.length < total;

    return {
      success: true,
      message: 'Insurance companies retrieved successfully',
      data: {
        companies,
        total,
        page,
        limit,
        hasMore,
      },
    };
  }
}
