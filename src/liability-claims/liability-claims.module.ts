import { Module } from '@nestjs/common';
import { LiabilityClaimsService } from './liability-claims.service';
import { LiabilityClaimsController } from './liability-claims.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [LiabilityClaimsController],
  providers: [LiabilityClaimsService, PrismaService],
})
export class LiabilityClaimsModule {}
