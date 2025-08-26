import { Controller, Post, Body, Get, Param, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ChangeRoleDto } from './dto/change-role.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Creates a new user account with USER role by default'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully created',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User with this email already exists' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.registerUser(createUserDto);
  }

  @Post('register/admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new admin user',
    description: 'Creates a new user account with ADMIN role (restricted endpoint)'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Admin user successfully created',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User with this email already exists' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  async registerAdmin(@Body() createUserDto: CreateUserDto) {
    return this.authService.createAdminUser(createUserDto);
  }

  @Get('user/:id')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieve user information by their unique identifier'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    example: 'clp1234567890abcdef'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User found',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async getUser(@Param('id') id: string) {
    return this.authService.findUserById(id);
  }

  @Patch('user/:id/role')
  @ApiOperation({ 
    summary: 'Change user role',
    description: 'Update a user\'s role (Admin only operation)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    example: 'clp1234567890abcdef'
  })
  @ApiBody({ type: ChangeRoleDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User role updated successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User or role not found' 
  })
  async changeUserRole(
    @Param('id') userId: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ) {
    return this.authService.changeUserRole(userId, changeRoleDto.roleName);
  }
}