import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminCustomerQueriesModule } from './customer-queries/admin-customer-queries.module';
import { AdminLiabilityClaimsModule } from './liability-claims/admin-liability-claims.module';
import { AdminReviewsModule } from './reviews/admin-reviews.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminCustomerQueriesModule,
    AdminLiabilityClaimsModule,
    AdminReviewsModule
  ],
})
export class AdminModule {}
