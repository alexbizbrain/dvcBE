import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminCustomerQueriesModule } from './customer-queries/admin-customer-queries.module';
import { AdminReviewsModule } from './reviews/admin-reviews.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminCrudModule } from './admin-users/admin-users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma.service';
import { HealthService } from './health.service';
import { InsuranceModule } from './insurance/insurance.module';
import { DvccConfigModule } from './dvcc-config/dvcc-config.module';

@Module({
  controllers: [AdminController],
  imports: [
    AdminAuthModule,
    AdminCustomerQueriesModule,
    AdminReviewsModule,
    AdminUsersModule,
    AdminCrudModule,
    InsuranceModule,
    DvccConfigModule,
  ],
  providers: [AdminService, PrismaService, HealthService],
  exports: [AdminService],
})
export class AdminModule {}
