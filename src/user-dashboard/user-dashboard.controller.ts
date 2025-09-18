import { Controller, UseGuards } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user-dashboard')
export class UserDashboardController {
  constructor(private readonly userDashboardService: UserDashboardService) {}
}
