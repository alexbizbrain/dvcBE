import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminLiabilityClaimsService } from './admin-liability-claims.service';
import { LiabilityClaimQueryDto } from './dto/liability-claim-query.dto';
import { CreateLiabilityClaimDto } from './dto/create-liability-claim-admin.dto';
import { UpdateLiabilityClaimDto } from './dto/update-liability-claim.dto';

@Controller('admin/liability-claims')
export class AdminLiabilityClaimsController {
  constructor(
    private readonly adminLiabilityClaimsService: AdminLiabilityClaimsService,
  ) {}

  @Get()
  async findAll(@Query() query: LiabilityClaimQueryDto) {
    const data = await this.adminLiabilityClaimsService.findAll(query);
    return {
      success: true,
      message: 'Liability claims retrieved successfully',
      data,
    };
  }

  @Get('counts')
  async counts() {
    const data = await this.adminLiabilityClaimsService.counts();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.adminLiabilityClaimsService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Liability claim retrieved successfully',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLiabilityClaimDto) {
    const data = await this.adminLiabilityClaimsService.create(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Liability claim created successfully',
      data,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLiabilityClaimDto) {
    const data = await this.adminLiabilityClaimsService.update(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Liability claim updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const result = await this.adminLiabilityClaimsService.remove(id);
    return { statusCode: HttpStatus.OK, message: result.message };
  }
}
