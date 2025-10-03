import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { CalculatorProgressService } from './calculator-progress.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { DvccConfigResponseDto } from './dto/dvcc-config-response.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { Public } from 'src/common/auth/decorators/public.decorator';
import { DvccConfigService } from '../admin/dvcc-config/dvcc-config.service';
import { PrismaService } from 'src/prisma.service';

@Controller('calculator-progress')
@UseGuards(JwtAuthGuard)
export class CalculatorProgressController {
  constructor(
    private readonly calculatorProgressService: CalculatorProgressService,
    private readonly dvccConfigService: DvccConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getProgress(@CurrentUser() user: { id: string }) {
    const userId = user.id;
    const progress = await this.calculatorProgressService.getProgress(userId);

    return {
      success: true,
      data: progress,
    };
  }

  @Get('claim/:claimId')
  async getProgressByClaimId(
    @CurrentUser() user: { id: string },
    @Param('claimId') claimId: string,
  ) {
    const userId = user.id;

    // Verify claim belongs to user
    const claim = await this.prisma.claim.findFirst({
      where: {
        id: claimId,
        userId: userId,
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found or unauthorized');
    }

    // Check if claim is eligible to continue (INPROGRESS or REPAIR_COST_PENDING)
    if (
      claim.status !== 'INPROGRESS' &&
      claim.status !== 'REPAIR_COST_PENDING'
    ) {
      throw new NotFoundException('This claim cannot be continued');
    }

    const progress = await this.calculatorProgressService.getProgressByClaimId(
      userId,
      claimId,
    );

    return {
      success: true,
      data: progress,
    };
  }

  @Post()
  async saveProgress(
    @CurrentUser() user: { id: string },
    @Body() saveProgressDto: SaveProgressDto,
  ) {
    const userId = user.id;

    const progress = await this.calculatorProgressService.saveProgress(
      userId,
      saveProgressDto,
    );

    return {
      success: true,
      message: 'Progress saved successfully',
      data: progress,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearProgress(@CurrentUser() user: { id: string }) {
    const userId = user.id;

    await this.calculatorProgressService.clearProgress(userId);

    return {
      success: true,
      message: 'Progress cleared successfully',
    };
  }

  @Post('submit')
  async submitCalculator(@CurrentUser() user: { id: string }) {
    const userId = user.id;
    await this.calculatorProgressService.submitCalculator(userId);

    return {
      success: true,
      message: 'Calculator submitted successfully',
    };
  }

  @Get('config')
  @Public()
  async getDvccConfig(): Promise<{
    success: boolean;
    data: DvccConfigResponseDto;
  }> {
    const config = await this.dvccConfigService.get();

    // Transform Prisma Decimal fields to numbers for frontend
    const responseData: DvccConfigResponseDto = {
      minApproxCarPrice: Number(config.minApproxCarPrice),
      minApproxCarPriceActive: config.minApproxCarPriceActive,
      minTotalRepairCost: config.minTotalRepairCost
        ? Number(config.minTotalRepairCost)
        : null,
      minTotalRepairCostActive: config.minTotalRepairCostActive,
      contingencyPlanPercentage: config.contingencyPlanPercentage
        ? Number(config.contingencyPlanPercentage)
        : null,
    };

    return {
      success: true,
      data: responseData,
    };
  }
}
