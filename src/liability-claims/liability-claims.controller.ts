import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { LiabilityClaimsService } from './liability-claims.service';
import { CreateLiabilityClaimDto } from './dto/create-liability-claim.dto';
import { Public } from 'src/common/auth/decorators/public.decorator';
import { ListLiabilityClaimDto } from './dto/list-liability-claim.dto';
import { Roles } from 'src/common/auth/decorators/roles.decorator';
import { UpdateLiabilityClaimDto } from './dto/update-liability-claim.dto';

@Controller('liability-claims')
export class LiabilityClaimsController {
  constructor(
    private readonly liabilityClaimsService: LiabilityClaimsService,
  ) {}

  @Public()
  @Post()
  create(@Body() createLiabilityClaimDto: CreateLiabilityClaimDto) {
    return this.liabilityClaimsService.create(createLiabilityClaimDto);
  }

  @Public()
  @Get()
  list(@Query() query: ListLiabilityClaimDto) {
    return this.liabilityClaimsService.list(query);
  }

  @Public()
  @Get(':id')
  get(@Param('id') id: string) {
    return this.liabilityClaimsService.getById(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateLiabilityClaimDto) {
    return this.liabilityClaimsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.liabilityClaimsService.remove(id);
    return { id, deleted: true };
  }
}
