import { Module } from '@nestjs/common';
import { CalculatorProgressController } from './calculator-progress.controller';
import { CalculatorProgressService } from './calculator-progress.service';
import { PrismaService } from '../prisma.service';
import { DvccConfigModule } from '../admin/dvcc-config/dvcc-config.module';
import { NotificationsModule } from '../notifications/notification.module';

@Module({
  imports: [DvccConfigModule, NotificationsModule],
  controllers: [CalculatorProgressController],
  providers: [CalculatorProgressService, PrismaService],
  exports: [CalculatorProgressService],
})
export class CalculatorProgressModule {}
