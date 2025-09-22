import {
  Controller,
  Post,
  Get,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminAuthService, AdminLoginResponse } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-auth.dto';
import { Public } from 'src/common/auth/decorators/public.decorator';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() adminLoginDto: AdminLoginDto,
  ): Promise<AdminLoginResponse> {
    return this.adminAuthService.login(adminLoginDto.email);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(): { message: string } {
    return { message: 'Admin logged out successfully' };
  }

  @Get('profile')
  getProfile(@Request() req) {
    return {
      admin: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role.name,
      },
    };
  }
}
