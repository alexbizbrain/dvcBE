import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Roles } from 'src/common/auth/decorators/roles.decorator';

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getSummary();
  }

  @Get('stats/eligibility')
  getEligibility() {
    return this.adminService.getEligibilityStats();
  }

  @Get('latest')
  getLatest() {
    return this.adminService.latestActivity();
  }

  @Get('critical')
  @UseGuards(AuthGuard('admin-jwt'))
  getCritical() {
    return this.adminService.criticalReport();
  }
}
