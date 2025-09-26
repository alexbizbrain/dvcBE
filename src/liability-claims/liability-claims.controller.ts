import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { LiabilityClaimsService } from './liability-claims.service';
import { CreateLiabilityClaimDto } from './dto/create-liability-claim.dto';
import { Public } from 'src/common/auth/decorators/public.decorator';

@Controller('liability-claims')
export class LiabilityClaimsController {
  constructor(
    private readonly liabilityClaimsService: LiabilityClaimsService,
  ) { }

  @Public()
  @Post()
  create(@Body() createLiabilityClaimDto: CreateLiabilityClaimDto) {
    return this.liabilityClaimsService.create(createLiabilityClaimDto);
  }
}
