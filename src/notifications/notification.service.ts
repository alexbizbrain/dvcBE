import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from 'src/services/email.service';
import { SmsService } from 'src/services/sms.service';
import { NotificationPriority, Prisma } from '@prisma/client';
import { Logger } from 'nestjs-pino';
import {
  NotificationEvent,
  EVENT_CONFIGURATIONS,
  STATUS_TO_EVENT_MAP,
} from './types/notification-events.types';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly logger: Logger,
  ) {}

  /**
   * Create a notification based on an event
   * Uses event configuration to determine priority, channels, and throttling
   */
  async notify(opts: {
    userId: string;
    event: NotificationEvent;
    claimId?: string;
    payload?: Prisma.InputJsonValue;
    titleOverride?: string;
    bodyOverride?: string;
  }) {
    const { userId, event, claimId, payload } = opts;

    // Get event configuration
    const config = EVENT_CONFIGURATIONS[event];
    if (!config) {
      this.logger.warn(`Unknown event type: ${event}`);
      return null;
    }

    // Use override or template
    const title = opts.titleOverride ?? config.titleTemplate;
    const body =
      opts.bodyOverride ??
      config.bodyTemplate.replace('{claimId}', claimId ?? '');

    // Only create in-app notification if config says so
    if (!config.inApp) {
      this.logger.log(
        `Event ${event} is configured for digest-only. Skipping in-app notification.`,
      );
      // Still create the notification record for daily digest
      return this.createNotificationRecord(
        userId,
        event,
        title,
        body,
        payload,
        config.priority,
      );
    }

    // Check throttling for in-app notifications (1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentNotification = await this.prisma.notification.findFirst({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If there's already a notification within the last hour, skip creating a new one
    if (recentNotification) {
      this.logger.log(
        `Throttled notification for user=${userId}, event=${event}. Last notification was ${Math.round((Date.now() - recentNotification.createdAt.getTime()) / 60000)} minutes ago.`,
      );
      return recentNotification;
    }

    // Create in-app notification (max once per hour per user)
    return this.createNotificationRecord(
      userId,
      event,
      title,
      body,
      payload,
      config.priority,
    );
  }

  /**
   * Helper to create notification record
   */
  private async createNotificationRecord(
    userId: string,
    event: NotificationEvent,
    title: string,
    body: string,
    payload: Prisma.InputJsonValue | undefined,
    priority: NotificationPriority,
  ) {
    const notif = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        eventType: event,
        payload: payload ?? {},
        priority,
      },
    });

    this.logger.log(
      `Created notification ${notif.id} for user=${userId}, event=${event}. Email/SMS will be sent in daily digest.`,
    );

    return notif;
  }

  /**
   * Legacy method for backward compatibility
   * Maps claim status to notification event
   */
  async notifyClaimStatusChanged(opts: {
    userId: string;
    newStatus: string;
    claimId: string;
    title?: string;
    body?: string;
    payload?: Prisma.InputJsonValue;
  }) {
    const { userId, newStatus, claimId } = opts;

    // Map status to event
    const event = STATUS_TO_EVENT_MAP[newStatus];
    if (!event) {
      this.logger.warn(`No event mapping for status: ${newStatus}`);
      return null;
    }

    // Use the new event-based notify method
    return this.notify({
      userId,
      event,
      claimId,
      payload: { ...((opts.payload as any) ?? {}), claimId, newStatus },
      titleOverride: opts.title,
      bodyOverride: opts.body,
    });
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
    // Verify notification belongs to user before updating
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      this.logger.warn(
        `User ${userId} attempted to mark non-existent or unauthorized notification ${id}`,
      );
      throw new Error('Notification not found or unauthorized');
    }

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
    // Verify notification belongs to user before deleting
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      this.logger.warn(
        `User ${userId} attempted to delete non-existent or unauthorized notification ${id}`,
      );
      throw new Error('Notification not found or unauthorized');
    }

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

  // ==================== Notification Preferences ====================

  async getOrCreateUserPreferences(userId: string) {
    let prefs = await this.prisma.userNotificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await this.prisma.userNotificationPreferences.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updateUserPreferences(
    userId: string,
    data: {
      enableEmailNotifications?: boolean;
      enableSmsNotifications?: boolean;
      emailDigestTime?: string;
      timezone?: string;
    },
  ) {
    const prefs = await this.getOrCreateUserPreferences(userId);
    return this.prisma.userNotificationPreferences.update({
      where: { id: prefs.id },
      data,
    });
  }

  // ==================== Daily Digest ====================

  async sendDailyDigests() {
    this.logger.log('Starting daily notification digest job...');

    // Get all users with pending notifications that haven't been sent
    const users = await this.prisma.user.findMany({
      where: {
        notifications: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
            emailSentAt: null, // Not yet sent via email
          },
        },
      },
      include: {
        notificationPreferences: true,
      },
    });

    this.logger.log(`Found ${users.length} users with pending notifications`);

    for (const user of users) {
      try {
        await this.sendUserDigest(user.id);
      } catch (error) {
        this.logger.error(
          `Failed to send digest for user ${user.id}: ${error.message}`,
        );
      }
    }

    this.logger.log('Daily notification digest job completed');
  }

  async sendUserDigest(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true },
    });

    if (!user) return;

    const prefs = user.notificationPreferences ?? {
      enableEmailNotifications: true,
      enableSmsNotifications: false,
    };

    // Get unsent notifications from last 24 hours
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        emailSentAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (notifications.length === 0) return;

    const now = new Date();

    // Filter notifications by event configuration
    const emailNotifications = notifications.filter((n) => {
      const config = EVENT_CONFIGURATIONS[n.eventType as NotificationEvent];
      return config?.emailDigest ?? true; // Default to true for unknown events
    });

    const smsNotifications = notifications.filter((n) => {
      const config = EVENT_CONFIGURATIONS[n.eventType as NotificationEvent];
      return config?.smsDigest ?? false; // Default to false for unknown events
    });

    // Send Email Digest
    if (
      prefs.enableEmailNotifications &&
      user.email &&
      emailNotifications.length > 0
    ) {
      const emailHtml = this.buildEmailDigest(emailNotifications, user);
      const ok = await this.emailService.sendHtmlEmail({
        to: user.email,
        subject: `Daily Update: ${emailNotifications.length} new notification${emailNotifications.length > 1 ? 's' : ''}`,
        html: emailHtml,
        text: this.buildTextDigest(emailNotifications),
      });

      if (ok) {
        // Mark all notifications as sent via email (even if not included)
        await this.prisma.notification.updateMany({
          where: { id: { in: notifications.map((n) => n.id) } },
          data: { emailSentAt: now },
        });
        this.logger.log(
          `Email digest sent to user ${userId} (${emailNotifications.length}/${notifications.length} notifications)`,
        );
      } else {
        this.logger.warn(`Email digest failed for user ${userId}`);
      }
    }

    // Send SMS Digest (only for events configured for SMS)
    if (
      prefs.enableSmsNotifications &&
      user.phoneNumber &&
      smsNotifications.length > 0
    ) {
      // Count high-priority notifications for SMS
      const highPriorityCount = smsNotifications.filter(
        (n) => n.priority === NotificationPriority.HIGH,
      ).length;

      const smsBody =
        highPriorityCount > 0
          ? `DVCC: You have ${highPriorityCount} important update${highPriorityCount > 1 ? 's' : ''} on your claim. Check your dashboard or email for details.`
          : `DVCC: You have ${smsNotifications.length} update${smsNotifications.length > 1 ? 's' : ''} on your claim. Check your dashboard for details.`;

      const res = await this.smsService.sendPlainSms(user.phoneNumber, smsBody);

      if (res.success) {
        await this.prisma.notification.updateMany({
          where: { id: { in: notifications.map((n) => n.id) } },
          data: { smsSentAt: now },
        });
        this.logger.log(
          `SMS digest sent to user ${userId} (${smsNotifications.length}/${notifications.length} notifications)`,
        );
      } else {
        this.logger.warn(`SMS digest failed for user ${userId}: ${res.error}`);
      }
    }
  }

  private buildEmailDigest(
    notifications: any[],
    user: { firstName?: string | null; lastName?: string | null },
  ): string {
    const userName = user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : 'there';

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C7974A;">Hi ${userName}!</h2>
        <p>Here's your daily update from DVCC:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
    `;

    notifications.forEach((n, idx) => {
      html += `
        <div style="background: white; padding: 15px; margin-bottom: ${idx < notifications.length - 1 ? '10px' : '0'}; border-radius: 4px; border-left: 3px solid #C7974A;">
          <h3 style="margin: 0 0 8px; font-size: 16px; color: #333;">${n.title}</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">${n.body}</p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #999;">${new Date(n.createdAt).toLocaleString()}</p>
        </div>
      `;
    });

    html += `
        </div>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          To view more details, please visit your <a href="${process.env.FRONTEND_URL || 'https://dvcc.com'}/dashboard" style="color: #C7974A;">dashboard</a>.
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
          You can manage your notification preferences in your account settings.
        </p>
      </div>
    `;

    return html;
  }

  private buildTextDigest(notifications: any[]): string {
    let text = 'Your Daily Update from DVCC\n\n';
    notifications.forEach((n, idx) => {
      text += `${idx + 1}. ${n.title}\n${n.body}\n${new Date(n.createdAt).toLocaleString()}\n\n`;
    });
    text +=
      '\nTo view more details, please visit your dashboard.\n\nYou can manage your notification preferences in your account settings.';
    return text;
  }
}
