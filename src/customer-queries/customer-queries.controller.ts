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
  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Creates a new customer query.
   *
   * @param createCustomerQueryDto A CreateCustomerQueryDto object
   * representing the customer query to be created.
   *
   * @returns A Promise that resolves to the newly created customer query.
   */
  /*******  92a5e1ad-5670-4e79-98ad-dd2f0c5586c0  *******/ ValidationPipe,
} from '@nestjs/common';
import { CustomerQueriesService } from './customer-queries.service';
import { CreateCustomerQueryDto } from './dto/create-customer-query.dto';
import { ListCustomerQueryDto } from './dto/list-customer-query.dto';
import { Roles } from 'src/common/auth/decorators/roles.decorator';
import { UpdateCustomerQueryDto } from './dto/update-customer-query.dto';
import { Public } from 'src/common/auth/decorators/public.decorator';

@Controller('customer-queries')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CustomerQueriesController {
  constructor(
    private readonly customerQueriesService: CustomerQueriesService,
  ) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateCustomerQueryDto) {
    if (!dto.countryCode) dto.countryCode = '+1';
    return this.customerQueriesService.create(dto);
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
