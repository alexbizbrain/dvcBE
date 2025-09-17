import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';
import { FileUploadResponseDto } from '../dto/file-upload-response.dto';
import { UploadResult } from '../interfaces/upload-result.interface';

@Injectable()
export class FileUploadService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
    customFileName?: string,
  ): Promise<FileUploadResponseDto> {
    const result: UploadResult = await this.s3Service.uploadFile(file, folder, customFileName);

    return {
      fileName: result.fileName,
      fileUrl: result.fileUrl,
    };
  }

  async deleteFile(s3Key: string): Promise<void> {
    await this.s3Service.deleteFile(s3Key);
  }
}