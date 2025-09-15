import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminCustomerQueriesModule } from './customer-queries/admin-customer-queries.module';
import { AdminLiabilityClaimsModule } from './liability-claims/admin-liability-claims.module';
import { AdminReviewsModule } from './reviews/admin-reviews.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminCrudModule } from './admin-users/admin-users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AdminController],
  imports: [
    AdminAuthModule,
    AdminCustomerQueriesModule,
    AdminLiabilityClaimsModule,
    AdminReviewsModule,
    AdminUsersModule,
    AdminCrudModule,
  ],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
