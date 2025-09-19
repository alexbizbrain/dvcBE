import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';

export interface AdminLoginResponse {
  success: boolean;
  accessToken: string;
  admin: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
}

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.password || user.role.name !== 'ADMIN') {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Admin account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any): Promise<AdminLoginResponse> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role.name,
    };

    return {
      success: true,
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '5h',
        issuer: this.configService.getOrThrow<string>('JWT_ISS'),
        audience: this.configService.getOrThrow<string>('JWT_AUD'),
      }),
      admin: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    };
  }

  async validateAdminById(adminId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: adminId },
      include: { role: true },
    });

    if (!user || !user.isActive || user.role.name !== 'ADMIN') {
      return null;
    }

    return user;
  }
}
