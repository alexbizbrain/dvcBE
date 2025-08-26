import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all roles',
    description: 'Retrieve all active roles in the system'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all roles',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clp1234567890abcdef' },
          name: { type: 'string', example: 'USER' },
          description: { type: 'string', example: 'Regular user with basic permissions' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-20T10:30:00.000Z' }
        }
      }
    }
  })
  async getAllRoles() {
    return this.rolesService.findAll();
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get role statistics',
    description: 'Get statistics about roles including user counts'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role statistics',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clp1234567890abcdef' },
          name: { type: 'string', example: 'USER' },
          description: { type: 'string', example: 'Regular user with basic permissions' },
          userCount: { type: 'number', example: 150 },
          isActive: { type: 'boolean', example: true }
        }
      }
    }
  })
  async getRoleStats() {
    return this.rolesService.getRoleStats();
  }

  @Get(':name/users')
  @ApiOperation({ 
    summary: 'Get users by role',
    description: 'Retrieve all users that have a specific role'
  })
  @ApiParam({ 
    name: 'name', 
    description: 'Role name (USER or ADMIN)',
    enum: ['USER', 'ADMIN'],
    example: 'USER'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users with the specified role',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clp1234567890abcdef' },
          email: { type: 'string', example: 'user@example.com' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          isActive: { type: 'boolean', example: true },
          role: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clp1234567890abcdef' },
              name: { type: 'string', example: 'USER' },
              description: { type: 'string', example: 'Regular user with basic permissions' }
            }
          }
        }
      }
    }
  })
  async getUsersByRole(@Param('name') roleName: string) {
    return this.rolesService.getUsersWithRole(roleName);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get role by ID',
    description: 'Retrieve a specific role by its unique identifier'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Role ID',
    example: 'clp1234567890abcdef'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clp1234567890abcdef' },
        name: { type: 'string', example: 'USER' },
        description: { type: 'string', example: 'Regular user with basic permissions' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-20T10:30:00.000Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Role not found' 
  })
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }
}