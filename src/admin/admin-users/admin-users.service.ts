// src/admin/admin-users/admin-users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
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
import { Prisma } from '@prisma/client';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminUsersService {
  private adminRoleIdCache?: string;
  constructor(private prisma: PrismaService) { }

  private async getAdminRoleId(): Promise<string> {
    if (this.adminRoleIdCache) return this.adminRoleIdCache;
    const role = await this.prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });
    if (!role) throw new NotFoundException('Admin role not found');
    this.adminRoleIdCache = role.id;
    return role.id;
  }

  private uniqueGuard(e: any) {
    if (e?.code === 'P2002') {
      const target = (e as Prisma.PrismaClientKnownRequestError).meta
        ?.target as string[] | undefined;
      if (target?.includes('email'))
        throw new ConflictException('Email already exists');
      if (target?.includes('phoneNumber'))
        throw new ConflictException('Phone number already exists');
      throw new ConflictException('Unique constraint failed');
    }
    throw e;
  }

  private selectUser() {
    return {
      id: true,
      email: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
      address: true,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isBusinessUser: true,
      createdAt: true,
      updatedAt: true,
      role: { select: { id: true, name: true } },
    } as const;
  }

  private toResponse(user: any): AdminUserResponseDto {
    return user; // already selected without password
  }

  async create(dto: CreateAdminUserDto): Promise<AdminUserResponseDto> {
    const adminRoleId = await this.getAdminRoleId();
    const hash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          password: hash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          isEmailVerified: true,
          isActive: true,
          roleId: adminRoleId,
        },
        select: this.selectUser(),
      });
      return this.toResponse(user);
    } catch (error) {
      this.uniqueGuard(error);
      throw error;
    }
  }

  async findAll(query: AdminQueryDto): Promise<PaginatedAdminUsersResponseDto> {
    const adminRoleId = await this.getAdminRoleId();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      roleId: adminRoleId,
      ...(query.isActive !== undefined
        ? { isActive: query.isActive === 'true' }
        : {}),
      ...(query.search
        ? {
          OR: [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { phoneNumber: { contains: query.search, mode: 'insensitive' } },
          ],
        }
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

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // explicit
        select: this.selectUser(),
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => this.toResponse(u)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: string): Promise<AdminUserResponseDto> {
    const adminRoleId = await this.getAdminRoleId();
    const user = await this.prisma.user.findFirst({
      where: { id, roleId: adminRoleId },
      select: this.selectUser(),
    });
    if (!user) throw new NotFoundException('Admin user not found');
    return this.toResponse(user);
  }

  async update(
    id: string,
    dto: UpdateAdminUserDto,
  ): Promise<AdminUserResponseDto> {
    // guard: must be admin user
    await this.findOne(id);

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          email: dto.email ?? undefined,
          phoneNumber: dto.phoneNumber ?? undefined,
          firstName: dto.firstName ?? undefined,
          lastName: dto.lastName ?? undefined,
          address: dto.address ?? undefined,
          isActive: dto.isActive ?? undefined,
          isEmailVerified: dto.isEmailVerified ?? undefined,
          isPhoneVerified: dto.isPhoneVerified ?? undefined,
          isBusinessUser: dto.isBusinessUser ?? undefined,
        },
        select: this.selectUser(),
      });
      return this.toResponse(user);
    } catch (e) {
      this.uniqueGuard(e);
      throw e;
    }
  }

  async remove(
    id: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const user = await this.findOne(id);
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    const protectedEmails = ['admin@dvcc.com', 'abdulwajid2818@gmail.com'];
    if (user.email && protectedEmails.includes(user.email.toLowerCase())) {
      throw new ForbiddenException(
        'This admin account is protected and cannot be deleted',
      );
    }
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true },
    });
    return { message: 'Admin user deactivated successfully' };
  }

  async changePassword(
    id: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.findOne(id);
    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hash },
      select: { id: true }, // minimal write select
    });
    return { message: 'Password changed successfully' };
  }

  async countAdmins(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const adminRoleId = await this.getAdminRoleId();
    const [total, active] = await Promise.all([
      this.prisma.user.count({ where: { roleId: adminRoleId } }),
      this.prisma.user.count({
        where: { roleId: adminRoleId, isActive: true },
      }),
    ]);
    return { total, active, inactive: total - active };
  }
}
