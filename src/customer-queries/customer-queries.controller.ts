import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  HttpStatus,
  HttpCode,
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

@Controller('customer-queries')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CustomerQueriesController {
  constructor(
    private readonly customerQueriesService: CustomerQueriesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCustomerQueryDto: CreateCustomerQueryDto) {
    return this.customerQueriesService.create(createCustomerQueryDto);
  }

  @Get()
  findAll() {
    return this.customerQueriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerQueriesService.findOne(id);
  }
}
