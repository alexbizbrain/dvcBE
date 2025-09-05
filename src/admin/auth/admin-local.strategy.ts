import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class AdminLocalStrategy extends PassportStrategy(
  Strategy,
  'admin-local',
) {
  constructor(private adminAuthService: AdminAuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const admin = await this.adminAuthService.validateAdmin(email, password);
    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    return admin;
  }
}
