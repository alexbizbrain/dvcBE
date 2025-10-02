import { Module } from '@nestjs/common';
import { NotificationsController } from './notification.controller';
import { NotificationsService } from './notification.service';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from 'src/services/email.service';
import { SmsService } from 'src/services/sms.service';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService, EmailService, SmsService],
  exports: [NotificationsService, EmailService, SmsService, PrismaService],
})
export class NotificationsModule {}
