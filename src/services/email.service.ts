import { Injectable, Logger } from '@nestjs/common';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESv2Client;

  constructor() {
    const region = process.env.AWS_REGION || 'us-west-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'AWS credentials not provided. SES email functionality will be disabled.',
      );
    }

    this.sesClient = new SESv2Client({
      region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
            accessKeyId,
            secretAccessKey,
          }
          : undefined,
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    try {
      // For development, log the OTP instead of sending it
      // if (process.env.NODE_ENV === 'development') {
      //   this.logger.log(`OTP for ${to}: ${otp}`);
      //   return true;
      // }

      // Check if AWS credentials are available
      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY
      ) {
        this.logger.warn(
          `AWS credentials not configured. Logging OTP instead: ${otp}`,
        );
        return true;
      }

      // Generate email templates
      const emailTemplates = this.generateOTPEmailTemplate({
        otpCode: otp,
        customerEmail: to,
        expirationMinutes: '10',
      });

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
                Data: emailTemplates.text,
                Charset: 'UTF-8',
              },
              Html: {
                Data: emailTemplates.html,
                Charset: 'UTF-8',
              },
            }
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

  private generateOTPEmailTemplate(data: {
    otpCode: string;
    customerEmail: string;
    expirationMinutes?: string;
  }): { html: string; text: string } {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const expirationMinutes = data.expirationMinutes;

    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code - DVCC</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background-color: #f5f5f5;
            padding: 20px 0;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }
        
        .header {
            background-color: #2a2a2a;
            padding: 40px 30px;
            text-align: center;
            border-bottom: 1px solid #3a3a3a;
        }
        
        .logo {
            width: 70px;
            height: 70px;
            line-height: 70px;
            margin: 0 auto;
            background-color: #A87C39;
            border-radius: 50%;
            display: flex;
            align-items: center;
            font-size: 20px;
            font-weight: 700;
            color: #1a1a1a;
            text-align: center;
            justify-content: center !important;
        }
        
        .content {
            padding: 50px 40px;
            background-color: #1a1a1a;
            text-align: center;
        }
        
        .greeting {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .description {
            color: #b0b0b0;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 40px;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
            border: 2px solid #A87C39;
            border-radius: 12px;
            padding: 30px;
            margin: 40px 0;
            position: relative;
        }
        
        .otp-container::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            background: linear-gradient(45deg, #A87C39, #B8941F, #A87C39);
            border-radius: 12px;
            z-index: -1;
            opacity: 0.7;
        }
        
        .otp-label {
            color: #A87C39;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        
        .otp-code {
            font-size: 40px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 8px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            text-align: center;
            padding: 10px 0;
            text-shadow: 0 2px 4px rgba(168, 124, 57, 0.3);
        }
        
        .expiry-info {
            color: #f39c12;
            font-size: 16px;
            font-weight: 500;
            margin-top: 30px;
            padding: 16px;
            background-color: rgba(243, 156, 18, 0.1);
            border-radius: 8px;
            border-left: 4px solid #f39c12;
        }
        
        .security-note {
            color: #e74c3c;
            font-size: 14px;
            margin-top: 30px;
            padding: 16px;
            background-color: rgba(231, 76, 60, 0.1);
            border-radius: 8px;
            border-left: 4px solid #e74c3c;
            text-align: left;
        }
        
        .help-text {
            color: #999999;
            font-size: 15px;
            margin-top: 30px;
            line-height: 1.5;
        }
        
        .footer {
            background-color: #2a2a2a;
            padding: 35px 30px;
            border-top: 1px solid #3a3a3a;
        }
        
        .footer-content {
            text-align: center;
        }
        
        .footer-text {
            color: #999999;
            font-size: 14px;
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        .footer-text a {
            color: #A87C39;
            text-decoration: none;
        }
        
        .footer-text a:hover {
            text-decoration: underline;
        }
        
        .company-info {
            color: #999999;
            font-size: 14px;
            margin-bottom: 25px;
        }
        
        .social-section {
            display: flex;
            justify-content: space-between !important;
            align-items: center;
            gap: 20px;
        }
        
        .logo-footer {
            width: 50px;
            height: 50px;
            line-height: 50px;
            background-color: #A87C39;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            color: #1a1a1a;
            justify-content: center !important;
        }
        
        .social-icons {
            display: flex;
            gap: 12px !important;
            align-items: center;
        }
        
        .social-icon {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            background-color: #3a3a3a;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: #ffffff;
            font-size: 16px;
            transition: all 0.3s ease;
            text-decoration: none !important;
        }
        
        .social-icon:hover {
            background-color: #4a4a4a;
            transform: translateY(-1px);
        }
        
        .social-icon.twitter {
            background-color: #1DA1F2;
        }
        
        .social-icon.facebook {
            background-color: #4267B2;
        }
        
        .social-icon.linkedin {
            background-color: #0077B5;
        }
        
        /* Mobile responsiveness */
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px 0;
            }
            
            .email-container {
                margin: 0 10px;
                border-radius: 8px;
            }
            
            .content, .header, .footer {
                padding: 30px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .description {
                font-size: 15px;
            }
            
            .otp-container {
                margin: 30px 0;
                padding: 25px 15px;
            }
            
            .otp-code {
                font-size: 32px;
                letter-spacing: 4px;
            }
            
            .social-section {
                flex-direction: column;
                gap: 15px;
            }
            
            .social-icons {
                gap: 20px;
            }
        }
        
        /* Dark mode email client support */
        @media (prefers-color-scheme: dark) {
            .email-container {
                border: 1px solid #3a3a3a;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header with Logo -->
        <div class="header">
            <div class="logo">
                DVCC
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <h1 class="greeting">Your Verification Code</h1>
            <p class="description">
                We received a request to verify your account. Enter the code below to complete your verification:
            </p>
            
            <!-- OTP Code Display -->
            <div class="otp-container">
                <div class="otp-label">Verification Code</div>
                <div class="otp-code">${data.otpCode}</div>
            </div>
            
            <!-- Expiry Information -->
            <div class="expiry-info">
                ⏰ This code will expire in <strong>${expirationMinutes} minutes</strong>
            </div>
            
           
            
            
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <div class="footer-text">
                    This email was sent to <a href="mailto:${data.customerEmail}">${data.customerEmail}</a>. If you'd rather not receive this kind of email, you can <a href="${frontendUrl}/unsubscribe?email=${encodeURIComponent(data.customerEmail)}">unsubscribe</a> or <a href="${frontendUrl}/email-preferences?email=${encodeURIComponent(data.customerEmail)}">manage your email preferences</a>.
                </div>
                
                <div class="company-info">
                    dvcc, 510 Townsend Street, San Francisco CA 94103
                </div>
                
                <div class="social-section">
                    <div class="logo-footer">
                        dvcc
                    </div>
                    <div class="social-icons">
                        <a href="https://twitter.com/dvcc" class="social-icon twitter" title="Twitter">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        </a>
                        <a href="https://facebook.com/dvcc" class="social-icon facebook" title="Facebook">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <a href="https://linkedin.com/company/dvcc" class="social-icon linkedin" title="LinkedIn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    const textTemplate = `Your DVCC Verification Code

We received a request to verify your account.

Your verification code is: ${data.otpCode}

This code will expire in ${expirationMinutes} minutes.

Security Notice: Never share this code with anyone. DVCC staff will never ask for your verification code via phone, email, or text message.

If you didn't request this verification code, please ignore this email or contact our support team if you have concerns.

---
dvcc, 510 Townsend Street, San Francisco CA 94103

This email was sent to ${data.customerEmail}.
Unsubscribe: ${frontendUrl}/unsubscribe?email=${encodeURIComponent(data.customerEmail)}`;

    return {
      html: htmlTemplate,
      text: textTemplate,
    };
  }

}
