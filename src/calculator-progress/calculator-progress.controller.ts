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
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';

@Controller('calculator-progress')
@UseGuards(JwtAuthGuard)
export class CalculatorProgressController {
  constructor(
    private readonly calculatorProgressService: CalculatorProgressService,
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
}
