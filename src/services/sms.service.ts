import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilio: Twilio.Twilio;
  private readonly messagingServiceSid: string;
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.getOrThrow('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.getOrThrow('TWILIO_AUTH_TOKEN');
    this.messagingServiceSid = this.configService.getOrThrow(
      'TWILIO_MESSAGING_SERVICE_SID',
    );

    this.isConfigured = !!(accountSid && authToken && this.messagingServiceSid);

    if (!this.isConfigured) {
      this.logger.warn(
        'Twilio credentials not configured properly. Need Account SID, Auth Token, and either Messaging Service SID or Phone Number.',
      );
    } else {
      this.twilio = Twilio(accountSid, authToken);

      this.logger.log(
        `Twilio SMS service initialized successfully using Messaging Service`,
      );
    }
  }

  async sendOtpSms(phoneNumber: string, otp: string): Promise<SmsResult> {
    try {
      // Check if Twilio is configured
      if (!this.isConfigured) {
        this.logger.warn(
          `Twilio not configured. Logging OTP instead: ${otp} for ${phoneNumber}`,
        );

        // In development, just log the OTP
        if (this.configService.get('NODE_ENV') === 'development') {
          return {
            success: true,
            messageId: 'dev-mode-' + Date.now(),
            status: 'development',
          };
        }

        return {
          success: false,
          error: 'SMS service not configured',
        };
      }

      // Format phone number to E.164 format
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

      if (!formattedPhoneNumber) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      // Create the OTP message
      const message = this.createOtpMessage(otp);

      // Send SMS via Twilio
      const messageParams: any = {
        body: message,
        to: formattedPhoneNumber,
        validityPeriod: 300,
        attempt: 1,
      };

      // Use Messaging Service SID
      if (this.messagingServiceSid) {
        messageParams.messagingServiceSid = this.messagingServiceSid;
        this.logger.log(
          `Sending SMS via Messaging Service: ${this.messagingServiceSid}`,
        );
      } else {
        return {
          success: false,
          error: 'No messaging service or phone number configured',
        };
      }

      const twilioMessage = await this.twilio.messages.create(messageParams);

      this.logger.log(
        `OTP SMS sent successfully to ${formattedPhoneNumber}, MessageSid: ${twilioMessage.sid}`,
      );
      console.log(twilioMessage);

      return {
        success: true,
        messageId: twilioMessage.sid,
        status: twilioMessage.status,
      };
    } catch (error) {
      this.logger.error(`Failed to send OTP SMS to ${phoneNumber}:`, {
        error: error.message,
        code: error.code,
        moreInfo: error.moreInfo,
      });

      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remove all non-numeric characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    // Handle US numbers
    if (cleanNumber.length === 10) {
      return `+1${cleanNumber}`;
    }

    // Handle US numbers with country code
    if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
      return `+${cleanNumber}`;
    }

    // If already formatted with +
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // Handle international numbers (assume they need country code)
    // You might want to make this more sophisticated based on your needs
    if (cleanNumber.length > 11) {
      return `+${cleanNumber}`;
    }

    // Invalid format
    this.logger.warn(`Invalid phone number format: ${phoneNumber}`);
    return null;
  }

  private createOtpMessage(otp: string): string {
    const appName = this.configService.getOrThrow('APP_NAME', 'DVCC');
    return `Your ${appName} verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nDon't share this code with anyone.`;
  }

  // Utility method to validate phone number
  isValidPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return formatted !== null;
  }
}
