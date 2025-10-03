import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { NotificationsService } from './notification.service';

/**
 * Scheduler service for automated notification tasks
 * Runs daily at 6 PM (18:00) to send notification digests
 */
@Injectable()
export class NotificationSchedulerService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly logger: Logger,
  ) {}

  /**
   * Cron job that runs automatically every day at 6 PM
   * Sends daily digest emails/SMS to all users with pending notifications
   */
  @Cron('0 18 * * *', {
    name: 'daily-notification-digest',
    timeZone: 'America/New_York', // EST timezone - adjust as needed
  })
  async handleDailyDigestCron() {
    this.logger.log('[CRON] Daily digest cron job triggered at 6 PM');
    await this.runDailyDigest();
  }

  /**
   * Sends daily digest emails to all users with pending notifications
   * This method should be called once per day (recommended: 6 PM each timezone)
   */
  async runDailyDigest(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('[SCHEDULER] Starting daily digest job...');
      await this.notificationsService.sendDailyDigests();
      this.logger.log('[SCHEDULER] Daily digest job completed successfully');
      return { success: true, message: 'Daily digest sent successfully' };
    } catch (error) {
      this.logger.error(
        `[SCHEDULER] Daily digest job failed: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: `Daily digest failed: ${error.message}`,
      };
    }
  }

  /**
   * Trigger manual digest for a specific user (useful for testing or on-demand)
   */
  async runUserDigest(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.log(`[SCHEDULER] Sending digest for user ${userId}...`);
      await this.notificationsService.sendUserDigest(userId);
      return {
        success: true,
        message: `Digest sent successfully for user ${userId}`,
      };
    } catch (error) {
      this.logger.error(
        `[SCHEDULER] User digest failed for ${userId}: ${error.message}`,
      );
      return {
        success: false,
        message: `Digest failed: ${error.message}`,
      };
    }
  }
}
