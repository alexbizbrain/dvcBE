export interface UploadResult {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  key: string; // S3 object key
}