import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '5h',
        issuer: process.env.JWT_ISS,
        audience: process.env.JWT_AUD,
      },
    }),
  ],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
