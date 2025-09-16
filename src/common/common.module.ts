import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PinoLoggerModule } from './logging/pino-logger.module';

@Global()
@Module({
  imports: [AppConfigModule, PinoLoggerModule],
  exports: [AppConfigModule, PinoLoggerModule],
})
export class CommonModule {}
