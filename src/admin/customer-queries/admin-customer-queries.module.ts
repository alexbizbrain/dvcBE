import { Module } from '@nestjs/common';
import { AdminCustomerQueriesService } from './admin-customer-queries.service';
import { AdminCustomerQueriesController } from './admin-customer-queries.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AdminCustomerQueriesController],
  providers: [AdminCustomerQueriesService, PrismaService],
  exports: [AdminCustomerQueriesService],
})
export class AdminCustomerQueriesModule {}
