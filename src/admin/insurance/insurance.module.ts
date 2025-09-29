import { Module } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { PrismaService } from 'src/prisma.service';
import { InsuranceController } from './insurance.controller';

@Module({
  controllers: [InsuranceController],
  providers: [InsuranceService, PrismaService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
