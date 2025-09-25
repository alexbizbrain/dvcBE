import { Controller, Get, Query } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { GetClaimsQueryDto } from './dto/claims-query.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';

@Controller('user-dashboard')
export class UserDashboardController {
  constructor(private readonly userDashboardService: UserDashboardService) {}

  @Get('stats')
  async stats(@CurrentUser() user: User) {
    const userId = user.id;
    const data = await this.userDashboardService.getStats(userId);
    return {
      success: true,
      data,
    };
  }

  @Get('active-claim')
  async activeClaim(@CurrentUser() user: User) {
    const userId = user.id;
    const data = await this.userDashboardService.getActiveClaim(userId);
    return {
      success: true,
      data,
    };
  }

  @Get('claims')
  async listMine(@CurrentUser() user: User, @Query() q: GetClaimsQueryDto) {
    const userId = user.id;
    return this.userDashboardService.listForUser(userId, q);
  }

  @Get('documents/latest')
  async lastestDocuments(@CurrentUser() user: User) {
    const userId = user.id;
    const data = await this.userDashboardService.getLatestDocuments(userId, 3);
    return {
      success: true,
      data,
    };
  }

  @Get('documents')
  async documents(@CurrentUser() user: User, @Query() q: GetDocumentsQueryDto) {
    const userId = user.id;
    const { page = 1, limit = 10 } = q;
    const data = await this.userDashboardService.listDocumnets(
      userId,
      page,
      limit,
    );
    return {
      success: true,
      data,
    };
  }
}
