import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CustomerQueriesService } from './customer-queries.service';
import { CreateCustomerQueryDto } from './dto/create-customer-query.dto';
import { ListCustomerQueryDto } from './dto/list-customer-query.dto';
import { Roles } from 'src/common/auth/decorators/roles.decorator';
import { UpdateCustomerQueryDto } from './dto/update-customer-query.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { Public } from 'src/common/auth/decorators/public.decorator';

@Controller('customer-queries')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CustomerQueriesController {
  constructor(
    private readonly customerQueriesService: CustomerQueriesService,
  ) {}

  @Public()
  @Post()
  async createPublic(@Body() dto: CreateCustomerQueryDto) {
    if (!dto.countryCode) dto.countryCode = '+1';
    // Public submission without user context
    return this.customerQueriesService.create(null, dto);
  }

  @Post('me')
  async createForAuthenticated(
    @CurrentUser() user: User,
    @Body() dto: CreateCustomerQueryDto,
  ) {
    if (!dto.countryCode) dto.countryCode = '+1';
    return this.customerQueriesService.create(user?.id, dto);
  }

  @Get()
  async list(@Query() query: ListCustomerQueryDto) {
    return this.customerQueriesService.list(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.customerQueriesService.getById(id);
  }

  @Patch(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerQueryDto) {
    return this.customerQueriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.customerQueriesService.remove(id);
    return {
      id,
      deleted: true,
    };
  }
}
