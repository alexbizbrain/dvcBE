import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CalculatorProgressService } from 'src/calculator-progress/calculator-progress.service';

@Injectable()
export class UserDashboardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly _calculatorProgressService: CalculatorProgressService,
  ) {}
}
