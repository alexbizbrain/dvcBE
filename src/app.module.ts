import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { LiabilityClaimsModule } from './liability-claims/liability-claims.module';
import { CustomerQueriesModule } from './customer-queries/customer-queries.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { ReviewsModule } from './admin/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AdminModule,
    LiabilityClaimsModule,
    CustomerQueriesModule,
    UsersModule,
    ReviewsModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
