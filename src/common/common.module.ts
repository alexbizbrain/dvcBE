import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PinoLoggerModule } from './logging/pino-logger.module';
import { FileUploadModule } from './file-upload/file-upload.module';

@Global()
@Module({
  imports: [AppConfigModule, PinoLoggerModule, FileUploadModule],
  exports: [AppConfigModule, PinoLoggerModule, FileUploadModule],
})
export class CommonModule {}
