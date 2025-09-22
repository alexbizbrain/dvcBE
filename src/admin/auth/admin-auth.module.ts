import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';
import { AdminJwtStrategy } from 'src/common/auth/strategies/admin-jwt.strategy';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthServiceCommon } from 'src/common/auth/admin-auth.service';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '24h',
        issuer: process.env.JWT_ISS,
        audience: process.env.JWT_AUD,
      },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [
    AdminAuthServiceCommon,
    AdminJwtStrategy,
    PrismaService,
    AdminAuthService,
  ],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
