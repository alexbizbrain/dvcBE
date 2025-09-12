import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserDto } from './dto/user.dto';
import { EmailService } from '../services/email.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async checkUserExists(email?: string, phoneNumber?: string) {
    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number is required');
    }

    const whereClause: any = {};
    if (email) whereClause.email = email;
    if (phoneNumber) whereClause.phoneNumber = phoneNumber;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: Object.keys(whereClause).map(key => ({ [key]: whereClause[key] }))
      }
    });

    return {
      exists: !!user,
      user: user ? {
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
        updatedAt: user.updatedAt
      } : null
    };
  }

  async createUser(userData: UserDto) {
    // Get or create default USER role

    console.log('User data received for creation:', userData);
    console.error('User data received for creation:', userData);
    let userRole = await this.prisma.role.findFirst({
      where: { name: 'USER' }
    });
    console.log('Default USER role:', userRole);
    if (!userRole) {
      userRole = await this.prisma.role.create({
        data: {
          name: 'USER',
          isActive: true
        }
      });
    }
    console.log('Using role for new user:', userRole);
    console
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        roleId: userRole.id
      }
    });
    console.log('Created user:', user);
    console.error('Created user:', user);
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
      updatedAt: user.updatedAt
    };
  }

  async sendOtp(email?: string, phoneNumber?: string) {
    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number must be provided');
    }

    // Find user
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phoneNumber ? { phoneNumber } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Store OTP in database
    await this.prisma.otp.create({
      data: {
        code: otpCode,
        type: email ? 'email' : 'phone',
        userId: user.id,
        expiresAt
      }
    });

    // Send OTP via email if email is provided
    if (email) {
      const emailSent = await this.emailService.sendOtpEmail(email, otpCode);
      if (!emailSent) {
        throw new Error('Failed to send OTP email');
      }
      
      return {
        success: true,
        message: `OTP sent to ${email}`,
        // Remove this in production:
        developmentOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined
      };
    }
    
    // For phone number OTP (SMS not implemented yet)
    if (phoneNumber) {
      // For development, log the OTP instead of sending SMS
      console.log(`OTP for ${phoneNumber}: ${otpCode}`);
      
      return {
        success: true,
        message: `OTP sent to ${phoneNumber}`,
        // Remove this in production:
        developmentOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined
      };
    }
  }

  async verifyOtp(otp: string, email?: string, phoneNumber?: string,) {
    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number must be provided');
    }

    // Find user
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phoneNumber ? { phoneNumber } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Find valid OTP
    const validOtp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: otp,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!validOtp) {
      throw new Error('Invalid or expired OTP');
    }

    // Update user verification status
    const updateData: any = { lastLoginAt: new Date() };
    if (email) updateData.isEmailVerified = true;
    if (phoneNumber) updateData.isPhoneVerified = true;

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: validOtp.id },
      data: { isUsed: true }
    });

    return {
      success: true,
      message: 'OTP verified successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        countryCode: updatedUser.countryCode,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isEmailVerified: updatedUser.isEmailVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
        isBusinessUser: updatedUser.isBusinessUser,
        isActive: updatedUser.isActive,
        lastLoginAt: updatedUser.lastLoginAt,
        roleId: updatedUser.roleId,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    };
  }
}