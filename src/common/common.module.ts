import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { LoggerModule } from './logging/logger.module';

@Global()
@Module({
  imports: [AppConfigModule, LoggerModule],
  exports: [AppConfigModule, LoggerModule],
})
export class CommonModule {}
