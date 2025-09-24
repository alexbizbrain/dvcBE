import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Res,
  UnauthorizedException,
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
import { Roles } from 'src/common/auth/decorators/roles.decorator';
import type { Response } from 'express';

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
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.verifyOtp(dto);

    const accessToken = await this.authService.issueAccessTokenForUserId(
      result.userId,
    );
    const refreshToken = await this.authService.issueRefreshTokenForUserId(
      result.userId,
    );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: (process.env.NODE_ENV ?? 'development') === 'production',
      sameSite: 'lax', // 'none' if cross-site with custom domain
      path: '/',
    });

    return {
      success: true,
      data: {
        token: accessToken,
      },
    };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Res({ passthrough: true }) res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _noop: any = {},
  ) {
    const refresh = (res.req as any).cookies?.refresh_token as
      | string
      | undefined;
    if (!refresh) throw new UnauthorizedException('No refresh cookie');

    const { accessToken /*, refreshToken*/ } =
      await this.authService.verifyRefreshAndIssueNewAccess(refresh);

    // If rotating:
    // if (refreshToken) {
    //   res.cookie('refresh_token', refreshToken, {
    //     httpOnly: true,
    //     secure: true,
    //     sameSite: 'lax',
    //     path: '/auth',
    //   });
    // }

    return { success: true, data: { accessToken } };
  }

  @Roles('user')
  @Get('me')
  async me(@CurrentUser() user: User) {
    Logger.log('Getting user:', user.id);
    return this.usersService.getSafeUserById(user.id);
  }

  @Get('recent-liability-claim')
  async getRecentLiabilityClaim(@CurrentUser() user: User) {
    return this.usersService.getRecentLiabilityClaim(user.id);
  }

  @Roles('user')
  @Post('logout')
  async logout(
    @CurrentUser() user: User,
    @AuthToken() token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('refresh_token', { path: '/' });
    return this.usersService.logout(user.id, token);
  }
}
