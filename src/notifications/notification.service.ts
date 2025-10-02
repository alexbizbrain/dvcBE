import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Channels } from './types/notification.types';
import { EmailService } from 'src/services/email.service';
import { SmsService } from 'src/services/sms.service';
import { NotificationPriority, Prisma } from '@prisma/client';
import { Logger } from 'nestjs-pino';

const STATE_RULES: Record<string, Channels> = {
  FINAL_OFFER_MADE: {
    inApp: true,
    email: true,
    sms: true,
  },
  CLAIM_SETTLED: {
    inApp: true,
    email: true,
  },
  CLAIM_PAID: {
    inApp: true,
    email: true,
  },
  NEGOTIATION: {
    inApp: true,
  },
  SUBMITTED_TO_INSURER: {
    inApp: true,
  },
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly logger: Logger,
  ) {}

  async notifyClaimStatusChanged(opts: {
    userId: string;
    newStatus: string;
    claimId: string;
    title?: string;
    body?: string;
    payload?: Prisma.InputJsonValue;
  }) {
    const { userId, newStatus, claimId } = opts;

    const channels = STATE_RULES[newStatus] ?? { inApp: true };
    const title = opts.title ?? 'Claim status updated';
    const body = opts.body ?? `Your claim ${claimId} is now ${newStatus}.`;
    const payload = { ...((opts.payload as any) ?? {}), claimId, newStatus };

    // inapp
    const notif = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        eventType: 'CLAIM_STATUS_CHANGED',
        payload,
        priority: NotificationPriority.NORMAL,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (channels.email && user?.email) {
      const html = `<p style="font-size:16px;margin:0 0 8px"><b>${title}</b></p><p style="margin:0">${body}</p>`;
      const ok = await this.emailService.sendHtmlEmail({
        to: user.email,
        subject: 'Your claim status has changed',
        html,
        text: `${title}\n\n${body}`,
      });
      if (!ok)
        this.logger.warn(`Email failed for user=${userId} claim=${claimId}`);
    }

    if (channels.sms && user?.phoneNumber) {
      const smsBody = `DVCC: ${body}`;
      const res = await this.smsService.sendPlainSms(user.phoneNumber, smsBody);
      if (!res.success)
        this.logger.warn(
          `SMS failed for user=${userId} claim=${claimId}: ${res.error}`,
        );
    }

    return notif;
  }

  async listUserNotifications(
    userId: string,
    before?: string,
    limit = 20,
    page?: number,
  ) {
    const where: any = { userId };
    if (before) where.createdAt = { lt: new Date(before) };

    const take = Math.min(limit, 50);
    const skip = !before && page && page > 1 ? (page - 1) * take : 0;

    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { items, unread };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true, count: res.count };
  }

  async delete(userId: string, id: string) {
    await this.prisma.notification.delete({
      where: { id },
    });
    return { ok: true };
  }

  async counts(userId: string) {
    const [total, unread] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { total, unread };
  }
}
