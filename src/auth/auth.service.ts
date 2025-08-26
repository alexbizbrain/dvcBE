import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { User } from '@prisma/client';

import type { CreateUserDto } from './dto/create-user.dto';
import type { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private rolesService: RolesService,
  ) {}

  async registerUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, firstName, lastName } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Get the default USER role
    const userRole = await this.rolesService.getUserRole();


    // Create user with USER role
    const newUser = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        roleId: userRole.id, // Assign USER role by default
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    // Return user without password
    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: {
        id: newUser.role.id,
        name: newUser.role.name,
      },
      createdAt: newUser.createdAt,
    };
  }

  async createAdminUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, firstName, lastName } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Get the ADMIN role
    const adminRole = await this.rolesService.getAdminRole();



    // Create admin user
    const newAdmin = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        roleId: adminRole.id, // Assign ADMIN role
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    // Return user without password
    return {
      id: newAdmin.id,
      email: newAdmin.email,
      firstName: newAdmin.firstName,
      lastName: newAdmin.lastName,
      role: {
        id: newAdmin.role.id,
        name: newAdmin.role.name,
      },
      createdAt: newAdmin.createdAt,
    };
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findUserById(id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      createdAt: user.createdAt,
    };
  }

  // async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  //   return bcrypt.compare(plainPassword, hashedPassword);
  // }

  async changeUserRole(userId: string, newRoleName: string): Promise<UserResponseDto> {
    const newRole = await this.rolesService.findByName(newRoleName);
    if (!newRole) {
      throw new NotFoundException(`Role '${newRoleName}' not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: newRole.id },
      include: { role: true },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: {
        id: updatedUser.role.id,
        name: updatedUser.role.name,
      },
      createdAt: updatedUser.createdAt,
    };
  }
}