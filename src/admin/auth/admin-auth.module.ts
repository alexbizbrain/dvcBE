import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminLocalStrategy } from './admin-local.strategy';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminLocalStrategy, AdminJwtStrategy, PrismaService],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}