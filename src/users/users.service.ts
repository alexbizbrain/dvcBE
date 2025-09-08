import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    let userRole = await this.prisma.role.findFirst({
      where: { name: 'USER' }
    });

    if (!userRole) {
      userRole = await this.prisma.role.create({
        data: {
          name: 'USER',
          isActive: true
        }
      });
    }

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        roleId: userRole.id
      }
    });

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
}