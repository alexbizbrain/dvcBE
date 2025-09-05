import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminCustomerQueriesModule } from './customer-queries/admin-customer-queries.module';

@Module({
  imports: [AdminAuthModule, AdminCustomerQueriesModule],
})
export class AdminModule {}
