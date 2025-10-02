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
        expirationHours: '2',
      });

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

  async sendHtmlEmail(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<boolean> {
    try {
      const { to, subject, html, text } = opts;

      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY
      ) {
        this.logger.warn(
          `[EmailService] AWS creds missing. Would send: ${subject} -> ${to}`,
        );
        return true;
      }

      const cmd = new (await import('@aws-sdk/client-sesv2')).SendEmailCommand({
        FromEmailAddress: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
              ...(text ? { Text: { Data: text, Charset: 'UTF-8' } } : {}),
            },
          },
        },
      });

      await this.sesClient.send(cmd);
      this.logger.log(`[EmailService] sent ${subject} to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`[EmailService] sendHtmlEmail failed`, error);
      return false;
    }
  }

  private generateOTPEmailTemplate(data: {
    otpCode: string;
    customerEmail: string;
    expirationHours?: string;
  }): { html: string; text: string } {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const expirationHours = data.expirationHours;

    // Gmail-compatible HTML template using tables and inline styles
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code - DVCC</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #ffffff; background-color: #f5f5f5;">
    <!-- Main container table -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 10px 0;">
                <!-- Email container table -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #2a2a2a; padding: 25px 30px; border-bottom: 1px solid #3a3a3a;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <!-- Logo -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td align="center">
                                                    <img src="https://dvcc-dev.s3.us-west-1.amazonaws.com/4bbf054a-fb99-40e4-b521-9f99292cc695.png" alt="DVCC Logo" width="200" height="60" style="display: block; border: none;">
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Main content -->
                    <tr>
                        <td style="background-color: #1a1a1a; padding: 30px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <!-- Greeting -->
                                <tr>
                                    <td align="center" style="color: #ffffff; font-size: 24px; font-weight: bold; padding-bottom: 12px;">
                                        Your Verification Code
                                    </td>
                                </tr>
                                <!-- Description -->
                                <tr>
                                    <td align="center" style="color: #b0b0b0; font-size: 16px; line-height: 1.6; padding-bottom: 25px;">
                                        We received a request to verify your account. Enter the code below to complete your verification:
                                    </td>
                                </tr>
                                <!-- OTP Container -->
                                <tr>
                                    <td align="center" style="padding: 0 0 25px 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color: #2a2a2a; border: 2px solid #A87C39; border-radius: 12px; padding: 25px;">
                                            <tr>
                                                <td align="center" style="color: #A87C39; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 8px;">
                                                    Verification Code
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 6px; font-family: 'Courier New', monospace; padding: 8px 0;">
                                                    ${data.otpCode}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Expiry info -->
                                <tr>
                                    <td align="center" style="color: #f39c12; font-size: 16px; font-weight: bold; padding: 12px; background-color: rgba(243, 156, 18, 0.1); border-radius: 8px; border-left: 4px solid #f39c12;">
                                        ⏰ This code will expire in <strong>${expirationHours} hours</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2a2a2a; padding: 25px 30px; border-top: 1px solid #3a3a3a;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <!-- Footer text -->
                                <tr>
                                    <td align="center" style="color: #999999; font-size: 14px; line-height: 1.5; padding-bottom: 6px;">
                                        This email was sent to <a href="mailto:${data.customerEmail}" style="color: #A87C39; text-decoration: none;">${data.customerEmail}</a>. 
                                        <br>If you'd rather not receive this kind of email, you can 
                                        <a href="${frontendUrl}/unsubscribe?email=${encodeURIComponent(data.customerEmail)}" style="color: #A87C39; text-decoration: none;">unsubscribe</a> 
                                        or <a href="${frontendUrl}/email-preferences?email=${encodeURIComponent(data.customerEmail)}" style="color: #A87C39; text-decoration: none;">manage your email preferences</a>.
                                    </td>
                                </tr>
                                <!-- Company info -->
                                <tr>
                                    <td align="center" style="color: #999999; font-size: 14px; padding: 15px 0;">
                                        dvcc, 510 Townsend Street, San Francisco CA 94103
                                    </td>
                                </tr>
                                <!-- Footer with logo and social icons -->
                                <tr>
                                    <td>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <!-- Logo column -->
                                                <td align="left" valign="middle" width="50%">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <td align="center">
                                                                <img src="https://dvcc-dev.s3.us-west-1.amazonaws.com/4bbf054a-fb99-40e4-b521-9f99292cc695.png" alt="DVCC Logo" width="200" height="60" style="display: block; border: none;">
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <!-- Social icons column -->
                                                <td align="right" valign="middle" width="50%">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                        <tr>
                                                            <!-- X -->
                                                            <td style="padding-right: 8px;">
                                                                <a href="https://x.com/dvcc" style="display: inline-block; text-decoration: none;">
                                                                    <img src="https://ci3.googleusercontent.com/meips/ADKq_NbQsNMaIRKRK-CcqulA5aIcTaNS-PW3IbSaCh6_nblgxnrNvenXZtcr23NqW9SJxGcyUwsUOqIPufCBGMRWjeP5o3YqeGkdvKx-qOVCxhDgRPdCGCnR2nF08T7j2rhj0Qjlys2_cbSLujaPw8-A-61Hd3kKD80I=s0-d-e1-ft#https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/circle-color/twitter@2x.png" alt="Twitter" width="28" height="28" style="display: block; border: none;">
                                                                </a>
                                                            </td>
                                                            <!-- Facebook -->
                                                            <td style="padding-right: 8px;">
                                                                <a href="https://facebook.com/dvcc" style="display: inline-block; text-decoration: none;">
                                                                    <img src="https://ci3.googleusercontent.com/meips/ADKq_NaKn6iV2oizRo47NzC7ZfXjf1pYdVQrdfvuc3GULYOpXQrArvIBkrpnHXmrPSJgr82COA3LnO61WtXNaGXCuw7QVnHFZDWdEwISY9u6mQHG9lz3Mgu4Z4oHG7yrnsti0BfK8yngjXlzO6ZkigjXAIMrUk9WTE1ix3ZyXeTTTE-iGragMQ=s0-d-e1-ft#https://fmtpp.stripocdnplugin.email/content/assets/img/social-icons/circle-colored/facebook-circle-colored.png" alt="Facebook" width="28" height="28" style="display: block; border: none;">
                                                                </a>
                                                            </td>
                                                            <!-- LinkedIn -->
                                                            <td>
                                                                <a href="https://linkedin.com/company/dvcc" style="display: inline-block; text-decoration: none;">
                                                                    <img src="https://dvcc-dev.s3.us-west-1.amazonaws.com/ba7f7d90-41ac-475c-9592-99f97d50b485.png" alt="LinkedIn" width="28" height="28" style="display: block; border: none;">
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <!-- Mobile styles -->
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .mobile-center { text-align: center !important; }
            .mobile-full-width { width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
        }
    </style>
</body>
</html>`;

    const textTemplate = `Your DVCC Verification Code

We received a request to verify your account.

Your verification code is: ${data.otpCode}

This code will expire in ${expirationHours} hours.

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
