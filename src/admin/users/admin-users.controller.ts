// src/admin/users/admin-users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto, PaginatedUsersResponseDto } from './dto/user-response.dto';
import { BulkActionDto } from './dto/bulk-action.dto';

@Controller('admin/users')
// @UseGuards(AdminGuard) // Uncomment when you implement admin authentication
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<{
    success: boolean;
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.adminUsersService.createUser(createUserDto);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  async findAllUsers(@Query() query: UserQueryDto): Promise<{
    success: boolean;
    message: string;
    data: PaginatedUsersResponseDto;
  }> {
    const result = await this.adminUsersService.findAllUsers(query);
    return {
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    };
  }

  @Get('stats')
  async getUserStats(): Promise<{
    success: boolean;
    message: string;
    data: {
      total: number;
      active: number;
      inactive: number;
      emailVerified: number;
      phoneVerified: number;
      businessUsers: number;
      recentRegistrations: number;
      countryDistribution: { country: string; count: number }[];
    };
  }> {
    const stats = await this.adminUsersService.getUserStats();
    return {
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':id')
  async findOneUser(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.adminUsersService.findOneUser(id);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Get(':id/otps')
  async getUserOtps(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      code: string;
      type: string;
      isUsed: boolean;
      expiresAt: Date;
      createdAt: Date;
    }[];
  }> {
    const otps = await this.adminUsersService.getUserOtps(id);
    return {
      success: true,
      message: 'User OTPs retrieved successfully',
      data: otps,
    };
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.adminUsersService.updateUser(id, updateUserDto);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Patch(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  async toggleUserStatus(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: UserResponseDto;
  }> {
    const user = await this.adminUsersService.toggleUserStatus(id);
    return {
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    };
  }

  @Post('bulk-action')
  @HttpCode(HttpStatus.OK)
  async bulkAction(@Body() bulkActionDto: BulkActionDto): Promise<{
    success: boolean;
    message: string;
    data: {
      success: number;
      failed: number;
      message: string;
    };
  }> {
    const result = await this.adminUsersService.bulkAction(bulkActionDto);
    return {
      success: true,
      message: 'Bulk action completed',
      data: result,
    };
  }

  @Delete(':id')
//   @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<any> {
    await this.adminUsersService.deleteUser(id);
    return {
      success: true,
      message: 'User deleted successfully',
      data: {},
    };
  }
}

