import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AdminCustomerQueriesService } from './admin-customer-queries.service';
import { CustomerQueryListDto } from './dto/customer-query-list.dto';

@Controller('admin/customer-queries')
export class AdminCustomerQueriesController {
  constructor(
    private readonly adminCustomerQueriesService: AdminCustomerQueriesService,
  ) {}

  @Get()
  async findAll(@Query() query: CustomerQueryListDto) {
    const data = await this.adminCustomerQueriesService.findAll(query);
    return { success: true, message: 'Customer queries retrieved', data };
  }

  @Get('count')
  async count() {
    const data = await this.adminCustomerQueriesService.count();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.adminCustomerQueriesService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Customer query retrieved',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const result = await this.adminCustomerQueriesService.remove(id);
    return { statusCode: HttpStatus.OK, message: result.message };
  }
}
