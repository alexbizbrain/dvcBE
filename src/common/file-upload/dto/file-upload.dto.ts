import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FileUploadDto {
  @IsOptional()
  @IsString()
  folder?: string; // Optional folder path in S3

  @IsOptional()
  @IsString()
  customFileName?: string; // Optional custom file name
}
