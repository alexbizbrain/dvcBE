import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { LiabilityClaimsModule } from './liability-claims/liability-claims.module';
import { CustomerQueriesModule } from './customer-queries/customer-queries.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { AuthCoreModule } from './common/auth/auth.module';
import { CalculatorProgressModule } from './calculator-progress/calculator-progress.module';
import { UserDashboardModule } from './user-dashboard/user-dashboard.module';
import { AdminAuthModule } from './admin/auth/admin-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    AuthCoreModule,
    AdminModule,
    LiabilityClaimsModule,
    CustomerQueriesModule,
    UsersModule,
    CalculatorProgressModule,
    UserDashboardModule,
    AdminAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
