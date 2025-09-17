export interface S3Config {
  region: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // For local testing with localstack
}