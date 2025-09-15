// src/admin/admin-users/admin-users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  AdminUserResponseDto,
  PaginatedAdminUsersResponseDto,
} from './dto/admin-user-response.dto';
import * as bcrypt from 'bcryptjs';
import { AdminQueryDto } from './dto/admin-query.dto';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    createAdminUserDto: CreateAdminUserDto,
  ): Promise<AdminUserResponseDto> {
    const { email, phoneNumber, password, ...userData } = createAdminUserDto;

    // Check if email already exists
    if (email) {
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUserByEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if phone number already exists
    if (phoneNumber) {
      const existingUserByPhone = await this.prisma.user.findUnique({
        where: { phoneNumber },
      });
      if (existingUserByPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Get admin role
    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (!adminRole) {
      throw new NotFoundException('Admin role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        email,
        phoneNumber,
        password: hashedPassword,
        roleId: adminRole.id,
        isEmailVerified: true, // Auto-verify admin users
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.formatUserResponse(user);
  }

  async findAll(query: AdminQueryDto): Promise<PaginatedAdminUsersResponseDto> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause for admin users
    const where: any = {
      role: {
        name: 'ADMIN',
      },
      isActive: true,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
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
      users: users.map((user) => this.formatUserResponse(user)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<AdminUserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: {
          name: 'ADMIN',
        },
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    return this.formatUserResponse(user);
  }

  async remove(
    id: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    // Check if user exists and is admin
    const user = await this.findOne(id);

    // Prevent user from deleting themselves
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Protected emails that cannot be deleted
    const protectedEmails = ['admin@dvcc.com', 'abdulwajid2818@gmail.com'];

    if (user.email && protectedEmails.includes(user.email.toLowerCase())) {
      throw new ForbiddenException(
        'This admin account is protected and cannot be deleted',
      );
    }

    // Soft delete: set isActive to false
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Admin user deactivated successfully' };
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Check if user exists and is admin
    await this.findOne(id);

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  private formatUserResponse(user: any): AdminUserResponseDto {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
