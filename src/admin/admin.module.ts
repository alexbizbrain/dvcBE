import { Module } from '@nestjs/common';
import { AdminCustomerQueriesModule } from './customer-queries/admin-customer-queries.module';

@Module({
  imports: [AdminCustomerQueriesModule],
})
export class AdminModule {}
