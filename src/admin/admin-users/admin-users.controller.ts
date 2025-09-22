// src/admin/admin-users/admin-users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpStatus,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminQueryDto } from './dto/admin-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@UseGuards(AuthGuard('admin-jwt'))
@Controller('admin/admin-users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAdminUserDto) {
    const user = await this.adminUsersService.create(dto);
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
      data: result,
    };
  }

  @Get('count')
  async count() {
    const data = await this.adminUsersService.countAdmins();
    return { success: true, data };
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

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    const user = await this.adminUsersService.update(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Admin user updated successfully',
      data: user,
    };
  }

  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    const result = await this.adminUsersService.changePassword(id, dto);
    return { statusCode: HttpStatus.OK, message: result.message };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req: any) {
    const result = await this.adminUsersService.remove(id, req.user.id);
    return { statusCode: HttpStatus.OK, message: result.message };
  }
}
