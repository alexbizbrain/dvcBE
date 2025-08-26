import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name: name.toUpperCase() },
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  async getUserRole(): Promise<Role> {
    const userRole = await this.findByName('USER');
    if (!userRole) {
      throw new NotFoundException('USER role not found. Please run database seeding.');
    }
    return userRole;
  }

  async getAdminRole(): Promise<Role> {
    const adminRole = await this.findByName('ADMIN');
    if (!adminRole) {
      throw new NotFoundException('ADMIN role not found. Please run database seeding.');
    }
    return adminRole;
  }

  async createRole(name: string): Promise<Role> {
    return this.prisma.role.create({
      data: {
        name: name.toUpperCase(),
        isActive: true,
      },
    });
  }

  async getUsersWithRole(roleName: string) {
    return this.prisma.user.findMany({
      where: {
        role: {
          name: roleName.toUpperCase(),
        },
        isActive: true,
      },
      include: {
        role: true,
      },
    });
  }

  async getRoleStats() {
    const roles = await this.prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      userCount: role._count.users,
      isActive: role.isActive,
    }));
  }
}