import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CalculatorProgressService } from './calculator-progress.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { DvccConfigResponseDto } from './dto/dvcc-config-response.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { DvccConfigService } from '../admin/dvcc-config/dvcc-config.service';

@Controller('calculator-progress')
@UseGuards(JwtAuthGuard)
export class CalculatorProgressController {
  constructor(
    private readonly calculatorProgressService: CalculatorProgressService,
    private readonly dvccConfigService: DvccConfigService,
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
  async getDvccConfig(): Promise<{
    success: boolean;
    data: DvccConfigResponseDto;
  }> {
    const config = await this.dvccConfigService.get();

    // Transform Prisma Decimal fields to numbers for frontend
    const responseData: DvccConfigResponseDto = {
      minApproxCarPrice: Number(config.minApproxCarPrice),
      maxApproxCarPrice: Number(config.maxApproxCarPrice),
      minApproxCarPriceActive: config.minApproxCarPriceActive,
      maxApproxCarPriceActive: config.maxApproxCarPriceActive,
      minTotalRepairCost: config.minTotalRepairCost
        ? Number(config.minTotalRepairCost)
        : null,
      minTotalRepairCostActive: config.minTotalRepairCostActive,
      maxTotalRepairCost: config.maxTotalRepairCost
        ? Number(config.maxTotalRepairCost)
        : null,
      maxTotalRepairCostActive: config.maxTotalRepairCostActive,
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
