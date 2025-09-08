import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('check')
  async checkUserExists(@Body() body: { email?: string; phoneNumber?: string }) {
    return this.usersService.checkUserExists(body.email, body.phoneNumber);
  }

  @Post('create')
  async createUser(@Body() userData: UserDto) {
    return this.usersService.createUser(userData);
  }
}