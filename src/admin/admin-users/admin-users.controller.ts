// src/admin/admin-users/admin-users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/admin-auth.guards';
import { AdminGuard } from '../auth/admin.guard';
import { AdminQueryDto } from './dto/admin-query.dto';

@Controller('admin/admin-users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAdminUserDto: CreateAdminUserDto) {
    const user = await this.adminUsersService.create(createAdminUserDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Admin user created successfully',
      data: user,
    };
  }

 @Get()
async findAll(@Query() query: AdminQueryDto) {
  const result = await this.adminUsersService.findAll(query);
  return {
    success: true,
    message: 'Admin users retrieved successfully',
    data: {
      users: result.users,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  };
}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.adminUsersService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Admin user retrieved successfully',
      data: user,
    };
  }


  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req: any) {
    const result = await this.adminUsersService.remove(id, req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const result = await this.adminUsersService.changePassword(id, changePasswordDto);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}