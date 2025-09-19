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
import { QueryCustomerQueriesDto } from './dto/query-customer-queries.dto';

@Controller('admin/customer-queries')
export class AdminCustomerQueriesController {
  constructor(
    private readonly adminCustomerQueriesService: AdminCustomerQueriesService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() queryDto: QueryCustomerQueriesDto) {
    return this.adminCustomerQueriesService.findAll(queryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.adminCustomerQueriesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.adminCustomerQueriesService.remove(id);
  }
}
