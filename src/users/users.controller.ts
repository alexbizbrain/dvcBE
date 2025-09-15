import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { Logger } from '@nestjs/common';
import { Public } from 'src/common/auth/decorators/public.decorator';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CheckUserExistsDto } from './dto/check-user-exists.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { AuthService } from 'src/auth/auth.service';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkUserExists(@Body() body: CheckUserExistsDto) {
    return this.usersService.checkUserExists(body.email, body.phoneNumber);
  }

  @Public()
  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createUser(@Body() userData: UserDto) {
    console.error('Creating user with data:', userData);
    Logger.log('Creating user with data:', userData);
    return this.usersService.createUser(userData);
  }

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.usersService.sendOtp(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.usersService.verifyOtp(dto);
    const token = await this.authService.issueAccessTokenForUserId(
      result.user.id,
    );
    return {
      ...result,
      message: result.message,
      token,
      user: result.user,
    };
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return user.id;
  }
}
