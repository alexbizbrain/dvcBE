import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import {
  UserResponseDto,
  PaginatedUsersResponseDto,
} from './dto/user-response.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma.service';
import { UserMetricsDto } from './dto/user-metrics.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) { }

  async metrics(): Promise<UserMetricsDto> {
    const [totalUsers, activeUsers, emailVerified, businessUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isEmailVerified: true } }),
        this.prisma.user.count({ where: { isBusinessUser: true } }),
      ]);

    return { totalUsers, activeUsers, emailVerified, businessUsers };
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Get USER role
    const userRole = await this.getUserRole();

    // Check for existing email or phone
    await this.checkDuplicates(createUserDto.email, createUserDto.phoneNumber);

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (createUserDto.password) {
      hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
          roleId: userRole.id,
        },
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
      });

      return this.mapToResponseDto(user);
    } catch {
      throw new BadRequestException('Failed to create user');
    }
  }

  async totalUsers(): Promise<number> {
    const allUsersCount = await this.prisma.user.count();
    return allUsersCount;
  }

  async findAllUsers(query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      isEmailVerified,
      isPhoneVerified,
      isBusinessUser,
      countryCode,
    } = query;
    const skip = (page - 1) * limit;

    // Get USER role to filter by
    const userRole = await this.getUserRole();

    // Build where clause
    const where: any = {
      roleId: userRole.id, // Only users with USER role
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (typeof isEmailVerified === 'boolean') {
      where.isEmailVerified = isEmailVerified;
    }

    if (typeof isPhoneVerified === 'boolean') {
      where.isPhoneVerified = isPhoneVerified;
    }
    if (typeof isBusinessUser === 'boolean') {
      where.isBusinessUser = isBusinessUser;
    }

    if (countryCode) {
      where.countryCode = { contains: countryCode, mode: 'insensitive' };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map((user) => this.mapToResponseDto(user)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOneUser(id: string): Promise<UserResponseDto> {
    const userRole = await this.getUserRole();

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        roleId: userRole.id, // Only users with USER role
      },
      include: {
        role: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToResponseDto(user);
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const userRole = await this.getUserRole();

    // Check if user exists and is a regular user
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        roleId: userRole.id,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check for duplicates if email or phone is being updated
    if (updateUserDto.email || updateUserDto.phoneNumber) {
      await this.checkDuplicates(
        updateUserDto.email,
        updateUserDto.phoneNumber,
        id,
      );
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 12);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          ...(hashedPassword && { password: hashedPassword }),
        },
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
      });
      return this.mapToResponseDto(updatedUser);
    } catch {
      throw new BadRequestException('Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<void> {
    const userRole = await this.getUserRole();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        roleId: userRole.id,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Delete user (OTPs will be deleted due to cascade)
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async toggleUserStatus(id: string): Promise<UserResponseDto> {
    const userRole = await this.getUserRole();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        roleId: userRole.id,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: !existingUser.isActive },
      include: {
        role: {
          select: { id: true, name: true },
        },
      },
    });

    return this.mapToResponseDto(updatedUser);
  }

  async bulkAction(bulkActionDto: BulkActionDto): Promise<{
    success: number;
    failed: number;
    message: string;
  }> {
    const { userIds, action } = bulkActionDto;
    const userRole = await this.getUserRole();

    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        const user = await this.prisma.user.findFirst({
          where: {
            id: userId,
            roleId: userRole.id,
          },
        });

        if (!user) {
          failed++;
          continue;
        }

        switch (action) {
          case 'activate':
            await this.prisma.user.update({
              where: { id: userId },
              data: { isActive: true },
            });
            success++;
            break;
          case 'deactivate':
            await this.prisma.user.update({
              where: { id: userId },
              data: { isActive: false },
            });
            success++;
            break;
          case 'delete':
            await this.prisma.user.delete({
              where: { id: userId },
            });
            success++;
            break;
        }
      } catch {
        failed++;
      }
    }

    return {
      success,
      failed,
      message: `Bulk ${action}: ${success} successful, ${failed} failed`,
    };
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    emailVerified: number;
    phoneVerified: number;
    businessUsers: number;
    recentRegistrations: number;
    countryDistribution: { country: string; count: number }[];
  }> {
    const userRole = await this.getUserRole();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      total,
      active,
      emailVerified,
      phoneVerified,
      businessUsers,
      recentRegistrations,
      countryData,
    ] = await Promise.all([
      this.prisma.user.count({ where: { roleId: userRole.id } }),
      this.prisma.user.count({
        where: { roleId: userRole.id, isActive: true },
      }),
      this.prisma.user.count({
        where: { roleId: userRole.id, isEmailVerified: true },
      }),
      this.prisma.user.count({
        where: { roleId: userRole.id, isPhoneVerified: true },
      }),
      this.prisma.user.count({
        where: { roleId: userRole.id, isBusinessUser: true },
      }),
      this.prisma.user.count({
        where: {
          roleId: userRole.id,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.user.groupBy({
        by: ['countryCode'],
        where: {
          roleId: userRole.id,
          countryCode: { not: null },
        },
        _count: { countryCode: true },
        orderBy: { _count: { countryCode: 'desc' } },
        take: 10,
      }),
    ]);

    const inactive = total - active;

    const countryDistribution = countryData.map((item) => ({
      country: item.countryCode || 'Unknown',
      count: item._count.countryCode,
    }));

    return {
      total,
      active,
      inactive,
      emailVerified,
      phoneVerified,
      businessUsers,
      recentRegistrations,
      countryDistribution,
    };
  }

  async getUserOtps(userId: string): Promise<
    {
      id: string;
      code: string;
      type: string;
      isUsed: boolean;
      expiresAt: Date;
      createdAt: Date;
    }[]
  > {
    const userRole = await this.getUserRole();

    // Verify user exists and is a regular user
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roleId: userRole.id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otps = await this.prisma.otp.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limit to recent OTPs
    });

    return otps;
  }

  private async getUserRole() {
    const userRole = await this.prisma.role.findUnique({
      where: { name: 'USER' },
    });

    if (!userRole) {
      throw new BadRequestException('USER role not found');
    }

    return userRole;
  }

  private async checkDuplicates(
    email?: string,
    phoneNumber?: string,
    excludeId?: string,
  ) {
    if (email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (phoneNumber) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phoneNumber,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }
  }

  private mapToResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      countryCode: user.countryCode,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isBusinessUser: user.isBusinessUser,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    };
  }
}
