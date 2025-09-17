import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { ClaimsQueryDto, PageQueryDto } from './dto/claims-query.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user-dashboard')
export class UserDashboardController {
  constructor(private readonly userDashboardService: UserDashboardService) {}

  @Get('summary')
  summary(@CurrentUser() user: { id: string }) {
    return this.userDashboardService.getSummary(user.id);
  }

  @Get('active-claim')
  activeClaim(@CurrentUser() user: { id: string }) {
    return this.userDashboardService.getActiveClaim(user.id);
  }

  @Get('claims')
  listClaims(
    @CurrentUser() user: { id: string },
    @Query() query: ClaimsQueryDto,
  ) {
    return this.userDashboardService.listClaims(user.id, query);
  }

  @Get('documents')
  documents(@CurrentUser() user: { id: string }, @Query() q: PageQueryDto) {
    const lim = Number(q?.pageSize ?? 2);
    return this.userDashboardService.getLatestDocuments(user.id, lim);
  }
}
