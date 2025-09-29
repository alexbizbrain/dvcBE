import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DvccConfigController } from './dvcc-config.controller';
import { DvccConfigService } from './dvcc-config.service';

@Module({
  controllers: [DvccConfigController],
  providers: [DvccConfigService, PrismaService],
  exports: [DvccConfigService],
})
export class DvccConfigModule {}
