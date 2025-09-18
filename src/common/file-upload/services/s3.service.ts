import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { UploadResult } from '../interfaces/upload-result.interface';
import { S3Config } from '../interfaces/s3-config.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const s3Config: S3Config = {
      region: this.configService.getOrThrow<string>('AWS_REGION', 'us-east-1'),
      bucketName: this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME'),
      accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow<string>(
        'AWS_SECRET_ACCESS_KEY',
      ),
    };

    if (
      !s3Config.bucketName ||
      !s3Config.accessKeyId ||
      !s3Config.secretAccessKey
    ) {
      throw new Error(
        'AWS S3 configuration is missing. Please check your environment variables.',
      );
    }

    this.bucketName = s3Config.bucketName;

    // Initialize S3 client
    this.s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      ...(s3Config.endpoint && {
        endpoint: s3Config.endpoint,
        forcePathStyle: true,
      }),
    });

    this.logger.log(`S3Service initialized with bucket: ${this.bucketName}`);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
    customFileName?: string,
  ): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique file name
      const fileExtension = this.getFileExtension(file.originalname);
      const fileName = customFileName
        ? `${customFileName}${fileExtension}`
        : `${randomUUID()}${fileExtension}`;

      // Create S3 key with optional folder
      const key = folder ? `${folder}/${fileName}` : fileName;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        // Option 1: Public files (free but less secure)
        // ACL: 'public-read',

        // Option 2: Private files with CloudFront (better security)
        // No ACL needed - files are private by default
      });

      await this.s3Client.send(command);

      // Generate file URL
      const fileUrl = this.generateFileUrl(key);

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        fileType: file.mimetype,
        key,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Check file type (PDF, PNG, JPG, JPEG only)
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpg',
      'image/jpeg',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, PNG, JPG, and JPEG files are allowed.',
      );
    }
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  private generateFileUrl(key: string): string {
    // Check if CloudFront is enabled and domain is configured
    // const useCloudFront = this.configService.get<boolean>('USE_CLOUDFRONT', false);
    // const cloudFrontDomain = this.configService.get<string>('CLOUDFRONT_DOMAIN');
    // console.log({useCloudFront, cloudFrontDomain});
    // if (useCloudFront  && cloudFrontDomain) {
    //   return `https://${cloudFrontDomain}/${key}`;
    // }

    // Fallback to direct S3 URL
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    return `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
  }
}
