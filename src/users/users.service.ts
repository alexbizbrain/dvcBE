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
  private OTP_TTL_MIN = 10;
  private OTP_MIN_INTERVAL_SEC = 60;

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
    if (!email && !phoneNumber)
      throw new BadRequestException(
        'Either email or phone number must be provided',
      );

    const or: Prisma.UserWhereInput[] = [];
    if (email) or.push({ email });
    if (phoneNumber) or.push({ phoneNumber });

    const user = await this.prismaService.user.findFirst({
      where: { OR: or },
    });

    if (!user) throw new NotFoundException('User not found');

    const lastOtp = await this.prismaService.otp.findFirst({
      where: {
        userId: user.id,
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
      },
      take: 1,
    });

    if (lastOtp) {
      const diffSec = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
      if (diffSec < this.OTP_MIN_INTERVAL_SEC) {
        throw new TooManyRequestsException({
          message: 'OTP already sent recently. Please wait a moment',
          $metadata: {
            httpStatusCode: 429,
          },
        });
      }
    }

    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_TTL_MIN * 60 * 1000);

    await this.prismaService.otp.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        isUsed: true,
      },
    });

    await this.prismaService.otp.create({
      data: {
        code: otpCode,
        type: email ? 'email' : 'phone',
        userId: user.id,
        expiresAt,
      },
    });

    if (email) {
      const ok = await this.emailService.sendOtpEmail(email, otpCode);
      if (!ok) throw new BadRequestException('Failed to send OTP email');
      console.log(`OTP for ${email}: ${otpCode}`);
      return {
        success: true,
        message: `OTP sent to ${email}`,
        developmentOtp:
          process.env.NODE_ENV === 'development' ? otpCode : undefined,
      };
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
    }
    return {
      success: true,
      message: `OTP sent to ${phoneNumber}`,
      developmentOtp:
        process.env.NODE_ENV === 'development' ? otpCode : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, phoneNumber, otp } = dto;
    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number must be provided');
    }

    console.log(email, dto.otp);

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

  private generateOtp(): string {
    // cryptographically stronger 6-digit OTP
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }
}
