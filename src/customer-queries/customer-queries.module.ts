import { Module } from '@nestjs/common';
import { CustomerQueriesService } from './customer-queries.service';
import { CustomerQueriesController } from './customer-queries.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CustomerQueriesController],
  providers: [CustomerQueriesService, PrismaService],
  exports: [CustomerQueriesService],
})
export class CustomerQueriesModule {}
