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

@Controller('calculator-progress')
@Public()
// @UseGuards(JwtAuthGuard)
export class CalculatorProgressController {
  constructor(
    private readonly calculatorProgressService: CalculatorProgressService,
  ) {}

  @Get()
  async getProgress(@Request() req) {
    // const userId = req.user.id; // Assuming JWT payload contains user id
    const userId = 'cmfmde41q0001fmhy5musgl57'; // Temporary hardcoded user ID for testing
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
    // const userId = req.user.id;
    const userId = 'cmfmde41q0001fmhy5musgl57'; // Temporary hardcoded user ID for testing

    await this.calculatorProgressService.clearProgress(userId);

    return {
      success: true,
      message: 'Progress cleared successfully',
    };
  }

  @Post('submit')
  async submitCalculator(@Request() req) {
    // const userId = req.user.id;
    const userId = 'cmfmde41q0001fmhy5musgl57'; // Temporary hardcoded user ID for testing
    await this.calculatorProgressService.submitCalculator(userId);

    return {
      success: true,
      message: 'Calculator submitted successfully',
    };
  }

  // Admin endpoint for analytics (optional)
  @Get('stats')
  async getProgressStats(@Request() req) {
    // You might want to add admin role guard here
    const stats = await this.calculatorProgressService.getProgressStats();

    return {
      success: true,
      data: stats,
    };
  }
}
