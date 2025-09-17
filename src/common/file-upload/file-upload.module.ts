import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './services/file-upload.service';
import { S3Service } from './services/s3.service';

@Module({
  imports: [ConfigModule],
  controllers: [FileUploadController],
  providers: [FileUploadService, S3Service],
  exports: [FileUploadService, S3Service], // Export services so other modules can use them
})
export class FileUploadModule {}