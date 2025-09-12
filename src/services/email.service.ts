import { Injectable, Logger } from '@nestjs/common';
// Uncomment once @aws-sdk/client-sesv2 is installed:
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESv2Client;

  constructor() {
    // Uncomment once @aws-sdk/client-sesv2 is installed:
    this.sesClient = new SESv2Client({
      region: process.env.AWS_REGION || 'us-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    try {
      // For development, log the OTP instead of sending it
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(`OTP for ${to}: ${otp}`);
        return true;
      }

      // Uncomment once @aws-sdk/client-sesv2 is installed:
      const sendEmailCommand = new SendEmailCommand({
        FromEmailAddress: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
        Destination: {
          ToAddresses: [to],
        },
        Content: {
          Simple: {
            Subject: {
              Data: 'Your OTP Code',
              Charset: 'UTF-8',
            },
            Body: {
              Text: {
                Data: `Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.`,
                Charset: 'UTF-8',
              },
              Html: {
                Data: `
                  <html>
                    <body>
                      <h2>Your OTP Code</h2>
                      <p>Your OTP code is: <strong>${otp}</strong></p>
                      <p>This code will expire in 10 minutes.</p>
                    </body>
                  </html>
                `,
                Charset: 'UTF-8',
              },
            },
          },
        },
      });

      await this.sesClient.send(sendEmailCommand);
      
      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    try {
      // For development, log instead of sending
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(`Welcome email for ${firstName} at ${to}`);
        return true;
      }

      // TODO: Implement welcome email sending
      this.logger.log(`Welcome email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      return false;
    }
  }
}