import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Delete,
  Body,
  Put,
} from '@nestjs/common';
import { NotificationsService } from './notification.service';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: User,
    @Query('before') before?: string,
    @Query('limit') limit = '20',
    @Query('page') page?: string,
  ) {
    const userId: string = user.id;
    return this.notificationsService.listUserNotifications(
      userId,
      before,
      parseInt(limit, 10),
      page ? parseInt(page, 10) : undefined,
    );
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: User, @Param('id') id: string) {
    const userId: string = user.id;
    return this.notificationsService.markRead(userId, id);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: User) {
    const userId: string = user.id;
    return this.notificationsService.markAllRead(userId);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    const userId: string = user.id;
    return this.notificationsService.delete(userId, id);
  }

  @Get('counts')
  async counts(@CurrentUser() user: User) {
    const userId: string = user.id;
    return this.notificationsService.counts(userId);
  }

  // ==================== Preferences ====================

  @Get('preferences')
  async getPreferences(@CurrentUser() user: User) {
    const userId: string = user.id;
    return this.notificationsService.getOrCreateUserPreferences(userId);
  }

  @Put('preferences')
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const userId: string = user.id;
    return this.notificationsService.updateUserPreferences(userId, dto);
  }
}
