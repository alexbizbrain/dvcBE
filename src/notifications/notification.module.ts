import { Module } from '@nestjs/common';
import { NotificationsController } from './notification.controller';
import { NotificationsService } from './notification.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationSchedulerController } from './notification-scheduler.controller';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from 'src/services/email.service';
import { SmsService } from 'src/services/sms.service';

@Module({
  imports: [],
  controllers: [NotificationsController, NotificationSchedulerController],
  providers: [
    NotificationsService,
    NotificationSchedulerService,
    PrismaService,
    EmailService,
    SmsService,
  ],
  exports: [NotificationsService, EmailService, SmsService, PrismaService],
})
export class NotificationsModule {}
