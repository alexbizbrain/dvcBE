import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminAuthServiceCommon } from '../admin-auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private adminAuth: AdminAuthServiceCommon,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      issuer: configService.getOrThrow<string>('JWT_ISS'),
      audience: configService.getOrThrow<string>('JWT_AUD'),
    });
  }

  async validate(payload: any) {
    console.log('admin-jwt payloaddddddddddddddddddddddddddddd', payload);
    const admin = await this.adminAuth.validateAdminById(payload.sub);
    if (!admin) throw new UnauthorizedException('Invalid admin token');
    // what you return here becomes req.user for this strategy
    return { id: admin.id, role: 'admin' as const };
  }
}
