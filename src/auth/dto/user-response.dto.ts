import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
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


}

export class UserResponseDto {
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
    type: RoleDto,
    description: 'User role information'
  })
  role: RoleDto;

  @ApiProperty({
    example: '2024-01-20T10:30:00.000Z',
    description: 'Account creation timestamp'
  })
  createdAt: Date;
}