import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminAuthService, AdminLoginResponse } from './admin-auth.service';
import { JwtAuthGuard, LocalAuthGuard } from './admin-auth.guards';
import { AdminLoginDto } from './dto/admin-auth.dto';
import { Public } from 'src/common/auth/decorators/public.decorator';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req,
    @Body() adminLoginDto: AdminLoginDto,
  ): Promise<AdminLoginResponse> {
    console.log(req.user);
    console.log(adminLoginDto);
    return this.adminAuthService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    return { message: 'Admin logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
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
