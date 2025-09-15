import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminAuthService } from '../admin-auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private adminAuth: AdminAuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const admin = await this.adminAuth.validateAdminById(payload.sub);
    if (!admin) throw new UnauthorizedException('Invalid admin token');
    // what you return here becomes req.user for this strategy
    return { id: admin.id, role: 'admin' as const };
  }
}
