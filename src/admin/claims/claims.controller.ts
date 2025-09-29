import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminClaimsQueryDto } from './dto/admin-claims-query.dto';
import { AdminDocsQueryDto } from './dto/admin-docs-query.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { MergeClaimJsonDto } from './dto/merge-claim-json.dto';
import type { Response } from 'express';
import { PatchVehicleInfoDto } from './dto/patch-vehicle-info.dto';
import { PatchAccidentInfoDto } from './dto/patch-accident-info.dto';
import { PatchInsuranceInfoDto } from './dto/patch-insurance-info.dto';
import { PatchLiabilityInfoDto } from './dto/patch-liability-info.dto';

@UseGuards(AuthGuard('admin-jwt'))
@Controller('admin/claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  async list(@Query() q: AdminClaimsQueryDto) {
    return this.claimsService.list(q);
  }

  @Get('stats')
  async stats(@Query() q: { from?: string; to?: string }) {
    return {
      success: true,
      data: await this.claimsService.stats(q.from, q.to),
    };
  }

  @Get('documents')
  async documents(@Query() q: AdminDocsQueryDto) {
    return {
      success: true,
      ...(await this.claimsService.listDocuments(q.page, q.limit)),
    };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return { success: true, data: await this.claimsService.getOne(id) };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateClaimStatusDto,
    @CurrentUser() user: User,
  ) {
    const adminId: string = user.id;
    return {
      success: true,
      data: await this.claimsService.updateStatus(id, dto.status, adminId),
    };
  }

  @Patch(':id/merge')
  async mergeJson(
    @Param('id') id: string,
    @Body() dto: MergeClaimJsonDto,
    @CurrentUser() user: User,
  ) {
    const adminId: string = user.id;
    return {
      success: true,
      data: await this.claimsService.mergeJson(id, dto, adminId),
    };
  }

  @Patch(':id/vehicle')
  async patchVehicle(
    @Param('id') id: string,
    @Body() dto: PatchVehicleInfoDto,
  ) {
    return {
      success: true,
      data: await this.claimsService.patchVehicleInfo(id, dto),
    };
  }

  @Patch(':id/accident')
  async patchAccident(
    @Param('id') id: string,
    @Body() dto: PatchAccidentInfoDto,
  ) {
    return {
      success: true,
      data: await this.claimsService.patchAccidentInfo(id, dto),
    };
  }

  @Patch(':id/insurance')
  async patchInsurance(
    @Param('id') id: string,
    @Body() dto: PatchInsuranceInfoDto,
  ) {
    return {
      success: true,
      data: await this.claimsService.patchInsuranceInfo(id, dto),
    };
  }

  @Patch(':id/liability')
  async patchLiability(
    @Param('id') id: string,
    @Body() dto: PatchLiabilityInfoDto,
  ) {
    return {
      success: true,
      data: await this.claimsService.patchLiabilityInfo(id, dto),
    };
  }

  @Post('export.csv')
  async exportCsv(@Query() q: AdminClaimsQueryDto, @Res() res: Response) {
    const csv = await this.claimsService.exportCsv(q);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="claims.csv"');
    res.send(csv);
  }
}
