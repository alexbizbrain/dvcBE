import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AdminLiabilityClaimsService } from './admin-liability-claims.service';
import { QueryLiabilityClaimsDto } from './dto/query-liability-claims.dto';
import { CreateLiabilityClaimAdminDto } from './dto/create-liability-claim-admin.dto';
import { UpdateLiabilityClaimDto } from './dto/update-liability-claim.dto';
import { JwtAuthGuard } from '../auth/admin-auth.guards';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin/liability-claims')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminLiabilityClaimsController {
  constructor(
    private readonly adminLiabilityClaimsService: AdminLiabilityClaimsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateLiabilityClaimAdminDto) {
    return this.adminLiabilityClaimsService.create(createDto);
  }

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
