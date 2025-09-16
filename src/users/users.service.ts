import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserDto } from './dto/user.dto';
import { EmailService } from '../services/email.service';
import { SafeUser } from './types/user.type';
import { Prisma, User } from '@prisma/client';
import { TooManyRequestsException } from '@aws-sdk/client-sesv2';
import { randomInt } from 'crypto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { SmsService } from '../services/sms.service';

@Injectable()
export class UsersService {
  private readonly OTP_TTL_MIN = 10; // code lives 10 minutes
  private readonly OTP_MIN_INTERVAL_SEC = 60; // at least 60s between sends
  private readonly OTP_MAX_PER_WINDOW = 3; // max 3 sends...
  private readonly OTP_WINDOW_MIN = 15; // ...per 15 minutes
  private readonly LIMIT_PER_CHANNEL = false;

  constructor(
    private prismaService: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService
  ) {}

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

    // --- resolve user ---
    const or: Prisma.UserWhereInput[] = [];
    if (email) or.push({ email });
    if (phoneNumber) or.push({ phoneNumber });

    const user = await this.prismaService.user.findFirst({ where: { OR: or } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const channel: 'email' | 'phone' = email ? 'email' : 'phone';
    const windowMs = this.OTP_WINDOW_MIN * 60 * 1000;
    const windowStart = new Date(now.getTime() - windowMs);

    // Do all checks and creation inside a serializable transaction
    const result = await this.prismaService.$transaction(
      async (tx) => {
        // --- rolling window cap ---
        const whereBase: Prisma.OtpWhereInput = {
          userId: user.id,
          createdAt: { gte: windowStart },
        };
        if (this.LIMIT_PER_CHANNEL) {
          whereBase.type = channel;
        }

        const recentCount = await tx.otp.count({ where: whereBase });
        if (recentCount >= this.OTP_MAX_PER_WINDOW) {
          // Find the oldest OTP in the window to compute accurate remaining time
          const oldestInWindow = await tx.otp.findFirst({
            where: whereBase,
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
          });

          const resetMs = oldestInWindow
            ? oldestInWindow.createdAt.getTime() + windowMs - now.getTime()
            : windowMs;

          const remainingSec = Math.max(0, Math.ceil(resetMs / 1000));

          throw new TooManyRequestsException({
            message: `OTP send limit reached. Try again in ${remainingSec}s`,
            $metadata: { httpStatusCode: 429 },
          });
        }

        // --- per-send minimum interval ---
        const lastActive = await tx.otp.findFirst({
          where: { userId: user.id, isUsed: false },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
          take: 1,
        });

        if (lastActive) {
          const diffSec =
            (now.getTime() - lastActive.createdAt.getTime()) / 1000;
          if (diffSec < this.OTP_MIN_INTERVAL_SEC) {
            const waitSec = Math.ceil(this.OTP_MIN_INTERVAL_SEC - diffSec);
            throw new TooManyRequestsException({
              message: `OTP already sent recently. Please wait ${waitSec}s`,
              $metadata: { httpStatusCode: 429 },
            });
          }
        }

        // --- invalidate active codes ---
        await tx.otp.updateMany({
          where: {
            userId: user.id,
            isUsed: false,
            expiresAt: { gt: now },
          },
          data: { isUsed: true },
        });

        // --- create new OTP ---
        const otpCode = this.generateOtp();
        const expiresAt = new Date(
          now.getTime() + this.OTP_TTL_MIN * 60 * 1000,
        );

        await tx.otp.create({
          data: {
            code: otpCode,
            type: channel,
            userId: user.id,
            expiresAt,
          },
        });

        return {
          otpCode,
          recentCountAfterCreate: recentCount + 1,
        };
      },
      { isolationLevel: 'Serializable' },
    );

    // --- send notification OUTSIDE txn ---
    const responseBase = {
      success: true,
      remainingSendsInWindow: Math.max(
        0,
        this.OTP_MAX_PER_WINDOW - result.recentCountAfterCreate,
      ),
      windowMinutes: this.OTP_WINDOW_MIN,
      minIntervalSec: this.OTP_MIN_INTERVAL_SEC,
      developmentOtp:
        process.env.NODE_ENV === 'development' ? result.otpCode : undefined,
    } as const;

    if (email) {
      const ok = await this.emailService.sendOtpEmail(email, result.otpCode);
      if (!ok) throw new BadRequestException('Failed to send OTP email');
      return { ...responseBase, message: `OTP sent to ${email}` };
    }
    
    // Send OTP via SMS if phone number is provided
    if (phoneNumber) {
      const smsSent = await this.smsService.sendOtpSms(phoneNumber, otpCode);
      if (!smsSent) {
        throw new Error('Failed to send OTP SMS');
      }
      
      return {
        success: true,
        message: `OTP sent to ${phoneNumber}`,
        // Remove this in production:
        developmentOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined
      };

    if (process.env.NODE_ENV !== 'production') {
      console.log(`OTP for ${phoneNumber}: ${result.otpCode}`);
    }
    return { ...responseBase, message: `OTP sent to ${phoneNumber}` };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, phoneNumber, otp } = dto;
    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number must be provided');
    }

    const or: Prisma.UserWhereInput[] = [];
    if (email) or.push({ email });
    if (phoneNumber) or.push({ phoneNumber });

    const user = await this.prismaService.user.findFirst({
      where: { OR: or },
    });

    if (!user) throw new NotFoundException('User not found');

    const validOtp = await this.prismaService.otp.findFirst({
      where: {
        userId: user.id,
        code: otp,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!validOtp) throw new NotFoundException('Invalid or expired OTP');

    const data: Prisma.UserUpdateInput = {};
    if (email) data.isEmailVerified = true;
    if (phoneNumber) data.isPhoneVerified = true;

    const updated = await this.prismaService.user.update({
      where: { id: user.id },
      data,
    });

    return {
      success: true,
      message: `OTP verified for ${email || phoneNumber}`,
      user: updated,
    };
  }

  async getSafeUserById(id: string) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.toSafeUser(user);
  }

  private generateOtp(): string {
    // cryptographically stronger 6-digit OTP
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }
}
