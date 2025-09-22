import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { AdminAuthServiceCommon } from 'src/common/auth/admin-auth.service';

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
    private readonly authService: AdminAuthServiceCommon,
  ) {}

  async login(email: string): Promise<AdminLoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.email) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const ValidateUser = await this.authService.validateAdminById(user.id);

    if (!ValidateUser) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = {
      sub: ValidateUser.id,
      role: ValidateUser.role,
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
        id: ValidateUser.id,
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
