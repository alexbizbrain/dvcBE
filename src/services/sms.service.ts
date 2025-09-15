import { Injectable, Logger } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly snsClient: SNSClient;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('AWS credentials not provided. SMS functionality will be disabled.');
    }

    this.snsClient = new SNSClient({
      region,
      credentials: accessKeyId && secretAccessKey ? {
        accessKeyId,
        secretAccessKey,
      } : undefined,
    });
  }

  async sendOtpSms(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      // Check if AWS credentials are available
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        this.logger.warn(`AWS credentials not configured. Logging OTP instead: ${otp}`);
        return true;
      }

      // Ensure phone number is in E.164 format for US numbers
      const formattedPhoneNumber = this.formatUSPhoneNumber(phoneNumber);
      
      const message = `Your DVCC verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nDo not share this code with anyone.`;

      const publishCommand = new PublishCommand({
        PhoneNumber: formattedPhoneNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'DVCC' // Your app name (up to 11 characters)
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional' 
          }
        }
      });

      const result = await this.snsClient.send(publishCommand);
      
      this.logger.log(`SMS sent successfully to ${formattedPhoneNumber}, MessageId: ${result.MessageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      return false;
    }
  }

  private formatUSPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // If it's a 10-digit US number, add +1 country code
    if (cleanNumber.length === 10) {
      return `+1${cleanNumber}`;
    }
    
    // If it already has country code (11 digits starting with 1), add +
    if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
      return `+${cleanNumber}`;
    }
    
    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // For any other format, assume it needs +1
    return `+1${cleanNumber}`;
  }
}