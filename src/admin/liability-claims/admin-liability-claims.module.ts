import { Module } from '@nestjs/common';
import { AdminLiabilityClaimsService } from './admin-liability-claims.service';
import { AdminLiabilityClaimsController } from './admin-liability-claims.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AdminLiabilityClaimsController],
  providers: [AdminLiabilityClaimsService, PrismaService],
})
export class AdminLiabilityClaimsModule {}
