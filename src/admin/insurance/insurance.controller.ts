import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import {
  CreateInsuranceCompanyDto,
  ListInsuranceCompaniesQuery,
  UpdateInsuranceCompanyDto,
} from './dto/insurance-company.dto';

@Controller('admin/insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Post()
  create(@Body() dto: CreateInsuranceCompanyDto) {
    return this.insuranceService.create(dto);
  }

  @Get()
  list(@Query() query: ListInsuranceCompaniesQuery) {
    return this.insuranceService.list(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.insuranceService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInsuranceCompanyDto) {
    return this.insuranceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.insuranceService.remove(id);
  }
}
