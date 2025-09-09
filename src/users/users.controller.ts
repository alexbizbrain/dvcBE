import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { Logger } from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('check')
  async checkUserExists(@Body() body: { email?: string; phoneNumber?: string }) {
    return this.usersService.checkUserExists(body.email, body.phoneNumber);
  }

  @Post('create')
  async createUser(@Body() userData: UserDto) {
    console.error('Creating user with data:', userData);
    Logger.log('Creating user with data:', userData);
    return this.usersService.createUser(userData);
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { email?: string; phoneNumber?: string }) {
    return this.usersService.sendOtp(body.email, body.phoneNumber);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email?: string; phoneNumber?: string; otp: string }) {
    return this.usersService.verifyOtp(body.otp, body.email, body.phoneNumber);
  }
}