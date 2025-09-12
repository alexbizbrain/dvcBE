import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../services/email.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, EmailService],
  exports: [UsersService]
})
export class UsersModule {}