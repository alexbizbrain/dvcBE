import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CalculatorProgressService } from './calculator-progress.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { JwtAuthGuard } from 'src/common/auth/guards/jwt-auth.guard';
import { Public } from 'src/common/auth/decorators/public.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';

@Controller('calculator-progress')
@UseGuards(JwtAuthGuard)
export class CalculatorProgressController {
  constructor(
    private readonly calculatorProgressService: CalculatorProgressService,
  ) { }

  @Get()
  async getProgress(@Request() req) {
    const userId = req.user.id;
    const progress = await this.calculatorProgressService.getProgress(userId);

    return {
      success: true,
      data: progress,
    };
  }

  @Post()
  async saveProgress(@Request() req, @Body() saveProgressDto: SaveProgressDto) {
    // const userId = req.user.id;
    const userId = 'cmfmde41q0001fmhy5musgl57'; // Temporary hardcoded user ID for testing

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
  async clearProgress(@Request() req) {
    const userId = req.user.id;

    await this.calculatorProgressService.clearProgress(userId);

    return {
      success: true,
      message: 'Progress cleared successfully',
    };
  }

  @Post('submit')
  async submitCalculator(@Request() req) {
    const userId = req.user.id;
    await this.calculatorProgressService.submitCalculator(userId);

    return {
      success: true,
      message: 'Calculator submitted successfully',
    };
  }

  // New endpoint: Get user's claim history (all claims for the user)
  @Get('history')
  async getClaimHistory(@Request() req) {
    const userId = req.user.id;
    const claims = await this.calculatorProgressService.getUserClaims(userId);

    return {
      success: true,
      data: claims,
    };
  }
}
