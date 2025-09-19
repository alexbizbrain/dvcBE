import { Global, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

export type JwtPayload = {
  sub: string;
  role?: 'admin' | 'user';
  email?: string;
};

const tokenExtractor = (req: Request) => {
  // Future-proof: prefer cookie later, header now
  const fromCookie = req?.cookies?.access_token as string | undefined;
  const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req); // Bearer <token>
  const token = fromCookie || fromHeader || null;

  if (token) req.rawToken = token; // stash once for decorators/controllers
  return token;
};

@Global()
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: tokenExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      audience: configService.get<string>('JWT_AUD'),
      issuer: configService.get<string>('JWT_ISS'),
    });
  }

  validate(payload: JwtPayload) {
    console.log(
      'jwt strategy validateeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      payload,
    );
    if (!payload?.sub)
      throw new UnauthorizedException('Token payload missing subject');
    return {
      id: payload.sub,
      role: payload.role ?? 'user',
      email: payload.email,
    };
  }
}
