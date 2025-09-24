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
import { AuthToken } from 'src/common/auth/decorators/auth-token.decorator';

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
      result.userId,
    );
    const user = await this.usersService.getSafeUserById(result.userId);
    return {
      ...result,
      message: result.message,
      token,
      user,
    };
  }

  @Get('me')
  async me(@CurrentUser() user: User) {
    return this.usersService.getSafeUserById(user.id);
  }

  @Get('recent-liability-claim')
  async getRecentLiabilityClaim(@CurrentUser() user: User) {
    return this.usersService.getRecentLiabilityClaim(user.id);
  }

  @Post('logout')
  async logout(@CurrentUser() user: User, @AuthToken() token: string) {
    Logger.log('Logging out user:', user.id);
    return this.usersService.logout(user.id, token);
  }
}
