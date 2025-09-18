import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './services/file-upload.service';
import { FileUploadDto } from './dto/file-upload.dto';
import { FileUploadResponseDto } from './dto/file-upload-response.dto';
import { Public } from '../auth/decorators/public.decorator';
// Import your JWT guard - adjust path as needed
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('file-upload')
// @UseGuards(JwtAuthGuard) // Uncomment if you want to protect the endpoint
@Public()
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, callback) => {
        // Additional file validation
        const allowedTypes = [
          'application/pdf',
          'image/png',
          'image/jpg',
          'image/jpeg',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Invalid file type. Only PDF, PNG, JPG, and JPEG files are allowed.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: FileUploadDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: FileUploadResponseDto;
  }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.fileUploadService.uploadFile(
      file,
      uploadDto.folder,
      uploadDto.customFileName,
    );

    return {
      success: true,
      message: 'File uploaded successfully',
      data: result,
    };
  }
}
