import { Module } from '@nestjs/common';
import { UserDashboardController } from './user-dashboard.controller';
import { UserDashboardService } from './user-dashboard.service';
import { PrismaService } from 'src/prisma.service';
import { CalculatorProgressService } from 'src/calculator-progress/calculator-progress.service';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { NotificationsModule } from 'src/notifications/notification.module';

@Module({
  imports: [NotificationsModule],
  controllers: [UserDashboardController],
  providers: [
    UserDashboardService,
    PrismaService,
    CalculatorProgressService,
    JwtAuthGuard,
  ],
  exports: [UserDashboardService],
})
export class UserDashboardModule {}
