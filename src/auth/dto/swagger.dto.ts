import { ApiProperty } from '@nestjs/swagger';

export class CreateUserSwaggerDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    format: 'email'
  })
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'User password (minimum 8 characters)',
    minLength: 8
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    required: false
  })
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    required: false
  })
  lastName?: string;
}

export class RoleSwaggerDto {
  @ApiProperty({
    example: 'clp1234567890abcdef',
    description: 'Role unique identifier'
  })
  id: string;

  @ApiProperty({
    example: 'USER',
    description: 'Role name',
    enum: ['USER', 'ADMIN']
  })
  name: string;

  @ApiProperty({
    example: 'Regular user with basic permissions',
    description: 'Role description',
    nullable: true
  })
  description: string | null;
}

export class UserResponseSwaggerDto {
  @ApiProperty({
    example: 'clp1234567890abcdef',
    description: 'User unique identifier'
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address'
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    nullable: true
  })
  firstName: string | null;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    nullable: true
  })
  lastName: string | null;

  @ApiProperty({
    type: RoleSwaggerDto,
    description: 'User role information'
  })
  role: RoleSwaggerDto;

  @ApiProperty({
    example: '2024-01-20T10:30:00.000Z',
    description: 'Account creation timestamp'
  })
  createdAt: Date;
}

export class ChangeRoleSwaggerDto {
  @ApiProperty({
    example: 'ADMIN',
    description: 'New role name for the user',
    enum: ['USER', 'ADMIN']
  })
  roleName: string;
}

export class ErrorResponseSwaggerDto {
  @ApiProperty({
    example: 409,
    description: 'HTTP status code'
  })
  statusCode: number;

  @ApiProperty({
    example: 'User with this email already exists',
    description: 'Error message'
  })
  message: string;

  @ApiProperty({
    example: 'Conflict',
    description: 'Error type'
  })
  error: string;
}