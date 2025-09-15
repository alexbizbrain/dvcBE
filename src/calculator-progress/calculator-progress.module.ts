import { Module } from '@nestjs/common';
import { CalculatorProgressController } from './calculator-progress.controller';
import { CalculatorProgressService } from './calculator-progress.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CalculatorProgressController],
  providers: [CalculatorProgressService, PrismaService],
  exports: [CalculatorProgressService],
})
export class CalculatorProgressModule {}