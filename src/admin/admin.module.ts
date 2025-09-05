import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminCustomerQueriesModule } from './customer-queries/admin-customer-queries.module';
import { AdminLiabilityClaimsModule } from './liability-claims/admin-liability-claims.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminCustomerQueriesModule,
    AdminLiabilityClaimsModule,
  ],
})
export class AdminModule {}
