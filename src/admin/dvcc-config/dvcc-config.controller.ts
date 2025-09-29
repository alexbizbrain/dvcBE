import {
  Body,
  Controller,
  Get,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DvccConfigService } from './dvcc-config.service';
import { UpdateDvccConfigDto } from './dto/dvcc-config.dto';

@Controller('admin/dvcc-config')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class DvccConfigController {
  constructor(private readonly service: DvccConfigService) {}

  @Get()
  async get() {
    const data = await this.service.get();
    return { success: true, data };
  }

  @Put()
  async update(@Body() dto: UpdateDvccConfigDto) {
    const data = await this.service.update(dto);
    return { success: true, message: 'Configuration saved', data };
  }
}
