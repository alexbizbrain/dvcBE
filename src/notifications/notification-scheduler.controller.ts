import {
  Controller,
  Post,
  Param,
  UseGuards,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';

/**
 * Scheduler endpoints for triggering notification jobs
 * Protected by API key authentication or admin guards
 */
@Controller('notifications/scheduler')
export class NotificationSchedulerController {
  constructor(
    private readonly schedulerService: NotificationSchedulerService,
  ) {}

  /**
   * Trigger daily digest for all users
   * Protected by API key authentication (set NOTIFICATION_CRON_API_KEY in .env)
   * Should be called by external cron service (GitHub Actions, AWS EventBridge, etc.)
   */
  @Post('daily-digest')
  async triggerDailyDigest(@Headers('x-api-key') apiKey?: string) {
    const validApiKey = process.env.NOTIFICATION_CRON_API_KEY;

    // Verify API key exists and matches
    if (!validApiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException(
        'Invalid or missing API key. Set X-API-Key header.',
      );
    }

    return this.schedulerService.runDailyDigest();
  }

  /**
   * Trigger digest for current authenticated user
   * Useful for testing or manual user trigger
   */
  @Post('my-digest')
  async triggerMyDigest(@CurrentUser() user: User) {
    return this.schedulerService.runUserDigest(user.id);
  }

  /**
   * Admin endpoint to trigger digest for specific user
   * Requires admin authentication
   */
  @UseGuards(AuthGuard('admin-jwt'))
  @Post('user-digest/:userId')
  async triggerUserDigest(@Param('userId') userId: string) {
    return this.schedulerService.runUserDigest(userId);
  }
}
