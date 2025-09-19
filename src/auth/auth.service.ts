import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

type AppRole = 'admin' | 'user';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // Used by your verify-otp flow
  async issueAccessTokenForUserId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },

      select: { id: true, email: true, roleId: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    // Resolve role name without requiring a Prisma relation on User
    let roleName = 'USER';
    if (user.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: user.roleId },
        select: { name: true },
      });
      roleName = role?.name ?? 'USER';
    }

    const role: AppRole = roleName.toUpperCase() === 'ADMIN' ? 'admin' : 'user';

    const payload = { sub: user.id, email: user.email ?? undefined, role };
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET!,
      expiresIn: '5h',
      issuer: process.env.JWT_ISS,
      audience: process.env.JWT_AUD,
    });
  }
}
