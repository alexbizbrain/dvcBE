import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminCustomerQueriesModule } from './customer-queries/admin-customer-queries.module';
import { AdminLiabilityClaimsModule } from './liability-claims/admin-liability-claims.module';
import { AdminReviewsModule } from './reviews/admin-reviews.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminCrudModule } from './admin-users/admin-users.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminCustomerQueriesModule,
    AdminLiabilityClaimsModule,
    AdminReviewsModule,
    AdminUsersModule,
    AdminCrudModule
  ],
})
export class AdminModule {}
