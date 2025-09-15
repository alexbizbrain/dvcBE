import { Module } from '@nestjs/common';
import { LiabilityClaimsService } from './liability-claims.service';
import { LiabilityClaimsController } from './liability-claims.controller';
import { PrismaService } from '../prisma.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [LiabilityClaimsController],
  providers: [LiabilityClaimsService, PrismaService],
})
export class LiabilityClaimsModule {}
