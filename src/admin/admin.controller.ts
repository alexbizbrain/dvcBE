import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from 'src/common/auth/decorators/roles.decorator';

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getOverview() {
    return this.adminService.getOverview();
  }
}
