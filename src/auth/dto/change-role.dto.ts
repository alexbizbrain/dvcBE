import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class ChangeRoleDto {
  @ApiProperty({
    example: 'ADMIN',
    description: 'New role name for the user',
    enum: ['USER', 'ADMIN']
  })
  @IsString()
  @IsIn(['USER', 'ADMIN'])
  roleName: string;
}