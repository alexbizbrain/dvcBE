import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LiabilityClaimsService } from './liability-claims.service';
import { CreateLiabilityClaimDto } from './dto/create-liability-claim.dto';

@Controller('liability-claims')
export class LiabilityClaimsController {
  constructor(private readonly liabilityClaimsService: LiabilityClaimsService) {}

  @Post()
  create(@Body() createLiabilityClaimDto: CreateLiabilityClaimDto) {
    return this.liabilityClaimsService.create(createLiabilityClaimDto);
  }

  @Get()
  findAll() {
    return this.liabilityClaimsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.liabilityClaimsService.findOne(id);
  }
}