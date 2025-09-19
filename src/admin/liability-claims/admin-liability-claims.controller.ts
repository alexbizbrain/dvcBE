import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AdminLiabilityClaimsService } from './admin-liability-claims.service';
import { QueryLiabilityClaimsDto } from './dto/query-liability-claims.dto';
import { UpdateLiabilityClaimDto } from './dto/update-liability-claim.dto';

@Controller('admin/liability-claims')
export class AdminLiabilityClaimsController {
  constructor(
    private readonly adminLiabilityClaimsService: AdminLiabilityClaimsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() queryDto: QueryLiabilityClaimsDto) {
    return this.adminLiabilityClaimsService.findAll(queryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.adminLiabilityClaimsService.findOne(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateDto: UpdateLiabilityClaimDto) {
    return this.adminLiabilityClaimsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.adminLiabilityClaimsService.remove(id);
  }
}
