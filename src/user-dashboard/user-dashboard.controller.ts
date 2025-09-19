import { Controller, Get, Query } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { GetClaimsQueryDto } from './dto/claims-query.dto';

@Controller('user-dashboard')
export class UserDashboardController {
  constructor(private readonly userDashboardService: UserDashboardService) {}

  @Get('claims')
  async listMine(@CurrentUser() user: User, @Query() q: GetClaimsQueryDto) {
    const userId = user.id;
    return this.userDashboardService.listForUser(userId, q);
  }
}
