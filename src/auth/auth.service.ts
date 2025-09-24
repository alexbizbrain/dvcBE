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

  private toAppRole(roleName?: string): AppRole {
    return (roleName ?? '').toUpperCase() === 'ADMIN' ? 'admin' : 'user';
  }

  // Used by your verify-otp flow
  async issueAccessTokenForUserId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: { select: { name: true } } },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const role = this.toAppRole(user.role?.name);

    const payload = { sub: user.id, email: user.email ?? undefined, role };
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET!,
      expiresIn: '45m', // shorter access lifetime
      issuer: process.env.JWT_ISS,
      audience: process.env.JWT_AUD,
    });
  }

  async issueRefreshTokenForUserId(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, typ: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET!, // NEW env
        expiresIn: '7d', // server-side validity (cookie is session)
        issuer: process.env.JWT_ISS,
        audience: process.env.JWT_AUD,
      },
    );
  }

  async verifyRefreshAndIssueNewAccess(refreshToken: string): Promise<{
    accessToken: string;
    // optionally rotate:
    refreshToken?: string;
  }> {
    let decoded: any;
    try {
      decoded = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET!,
        issuer: process.env.JWT_ISS,
        audience: process.env.JWT_AUD,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = decoded?.sub as string | undefined;
    if (!userId) throw new UnauthorizedException('Invalid refresh token');

    // (Optional) you could check user active status here
    const accessToken = await this.issueAccessTokenForUserId(userId);

    // (Optional) rotate refresh tokens to reduce theft window
    // const newRefresh = await this.issueRefreshTokenForUserId(userId);

    return { accessToken /*, refreshToken: newRefresh*/ };
  }
}
