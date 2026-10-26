import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailjetService {
  private readonly logger = new Logger(MailjetService.name);

  constructor(private readonly configService: ConfigService) {}

  private getAuthHeader(): string {
    const apiKey = this.configService.get<string>(
      'MAILJET_APIKEY',
      '6dbf2765c7faff797b664ad72583e1ac',
    );
    const apiSecret = this.configService.get<string>(
      'MAILJET_APISECRET',
      '6e6b5d0ef8ed01f73a5cc76a07f4ba4f',
    );
    return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
  }

  async sendVerificationEmail(
    toEmail: string,
    displayName: string,
    verificationUrl: string,
  ): Promise<boolean> {
    const fromEmail = this.configService.get<string>(
      'MAIL_FROM_ADDRESS',
      'konarch@patterns247.net',
    );
    const fromName = this.configService.get<string>(
      'MAIL_FROM_NAME',
      'VARTA — Baat Sabki',
    );
    const isSandbox =
      this.configService.get<string>('MAILJET_SANDBOX', 'false') === 'true';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate your VARTA account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #050B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #0B1422; border: 1px solid #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <!-- Top Accent Gradient Stripe -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #00C853 100%);"></td>
          </tr>
          
          <!-- Header Branding -->
          <tr>
            <td style="padding: 36px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; color: #FFFFFF;">
                VARTA
              </h1>
              <div style="margin-top: 6px; font-size: 11px; font-weight: 700; color: #94A3B8; letter-spacing: 2px; text-transform: uppercase;">
                <span style="color: #FF9933;">—</span> Baat Sabki <span style="color: #00C853;">—</span>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: #1E293B;"></div>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">
                Activate Your Account
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #CBD5E1;">
                Namaste <strong style="color: #FFFFFF;">${displayName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                Thank you for joining <strong style="color: #FFFFFF;">VARTA</strong> — India's premier space for authentic conversations and community discourse.
              </p>
              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                To complete your registration and activate your account, please confirm your email address by clicking the button below:
              </p>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; background: linear-gradient(90deg, #FF7A00 0%, #FF9933 100%); color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 14px; box-shadow: 0 8px 24px rgba(255, 122, 0, 0.35); letter-spacing: 0.3px;">
                      Activate My Account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry & Fallback Notice -->
              <div style="background-color: #101D2D; border: 1px solid #1E293B; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #94A3B8;">
                  ⏱️ <strong>Note:</strong> This activation link will expire in <strong>24 hours</strong>.
                </p>
                <p style="margin: 0; font-size: 12px; color: #64748B; word-break: break-all;">
                  Button not working? Copy and paste this URL into your browser:<br>
                  <a href="${verificationUrl}" style="color: #38BDF8; text-decoration: underline;">${verificationUrl}</a>
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                If you did not register for an account on VARTA, please disregard this email. Your email will not be used without verification.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #070E18; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © 2026 VARTA — Baat Sabki. Made with ❤️ for India.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const payload = {
      Messages: [
        {
          From: {
            Email: fromEmail,
            Name: fromName,
          },
          To: [
            {
              Email: toEmail,
              Name: displayName,
            },
          ],
          Subject: 'Activate your VARTA account',
          HTMLPart: htmlContent,
          CustomID: 'VartaEmailVerification',
          SandboxMode: isSandbox,
        },
      ],
    };

    try {
      this.logger.log(`Dispatching Mailjet confirmation email to ${toEmail}...`);
      const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();
      if (!response.ok) {
        this.logger.error(`Mailjet API Error (${response.status}): ${JSON.stringify(data)}`);
        return false;
      }

      const status = data.Messages?.[0]?.Status;
      if (status === 'success') {
        this.logger.log(`Mailjet email delivered successfully to ${toEmail}`);
        return true;
      }

      this.logger.warn(`Mailjet returned message status: ${status}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send verification email via Mailjet: ${err.message}`, err.stack);
      return false;
    }
  }

  async sendPasswordResetEmail(
    toEmail: string,
    displayName: string,
    resetUrl: string,
  ): Promise<boolean> {
    const fromEmail = this.configService.get<string>(
      'MAIL_FROM_ADDRESS',
      'konarch@patterns247.net',
    );
    const fromName = this.configService.get<string>(
      'MAIL_FROM_NAME',
      'VARTA — Baat Sabki',
    );
    const isSandbox =
      this.configService.get<string>('MAILJET_SANDBOX', 'false') === 'true';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your VARTA password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #050B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #0B1422; border: 1px solid #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #00C853 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; color: #FFFFFF;">
                VARTA
              </h1>
              <div style="margin-top: 6px; font-size: 11px; font-weight: 700; color: #94A3B8; letter-spacing: 2px; text-transform: uppercase;">
                <span style="color: #FF9933;">—</span> Baat Sabki <span style="color: #00C853;">—</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: #1E293B;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #CBD5E1;">
                Namaste <strong style="color: #FFFFFF;">${displayName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                We received a request to reset the password for your VARTA account. Click the button below to choose a new password:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; background: linear-gradient(90deg, #FF7A00 0%, #FF9933 100%); color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 14px; box-shadow: 0 8px 24px rgba(255, 122, 0, 0.35); letter-spacing: 0.3px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #101D2D; border: 1px solid #1E293B; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #94A3B8;">
                  ⏱️ <strong>Note:</strong> This link is valid for <strong>1 hour</strong>.
                </p>
                <p style="margin: 0; font-size: 12px; color: #64748B; word-break: break-all;">
                  Button not working? Copy and paste this URL into your browser:<br>
                  <a href="${resetUrl}" style="color: #38BDF8; text-decoration: underline;">${resetUrl}</a>
                </p>
              </div>
              <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                If you did not request a password reset, please ignore this email. Your password will not change.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #070E18; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © 2026 VARTA — Baat Sabki. Made with ❤️ for India.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const payload = {
      Messages: [
        {
          From: {
            Email: fromEmail,
            Name: fromName,
          },
          To: [
            {
              Email: toEmail,
              Name: displayName,
            },
          ],
          Subject: 'Reset your VARTA password',
          HTMLPart: htmlContent,
          CustomID: 'VartaPasswordReset',
          SandboxMode: isSandbox,
        },
      ],
    };

    try {
      this.logger.log(`Dispatching password reset email to ${toEmail}...`);
      const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();
      if (!response.ok) {
        this.logger.error(`Mailjet API Error (${response.status}): ${JSON.stringify(data)}`);
        return false;
      }

      this.logger.log(`Password reset email delivered successfully to ${toEmail}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send password reset email via Mailjet: ${err.message}`, err.stack);
      return false;
    }
  }

  async sendOtpEmail(
    toEmail: string,
    displayName: string,
    otp: string,
    purpose: 'login' | 'signup',
  ): Promise<boolean> {
    const fromEmail = this.configService.get<string>(
      'MAIL_FROM_ADDRESS',
      'konarch@patterns247.net',
    );
    const fromName = this.configService.get<string>(
      'MAIL_FROM_NAME',
      'VARTA — Baat Sabki',
    );
    const isSandbox =
      this.configService.get<string>('MAILJET_SANDBOX', 'false') === 'true';

    const title = purpose === 'signup' ? 'Verify Your Email Address' : 'Your Sign In Code';
    const subject =
      purpose === 'signup'
        ? `${otp} is your VARTA registration verification code`
        : `${otp} is your VARTA sign in code`;
    const actionDesc =
      purpose === 'signup'
        ? 'complete your account registration and activate your profile on VARTA'
        : 'sign in to your VARTA account without a password';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #050B14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #0B1422; border: 1px solid #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #00C853 100%);"></td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; color: #FFFFFF;">
                VARTA
              </h1>
              <div style="margin-top: 6px; font-size: 11px; font-weight: 700; color: #94A3B8; letter-spacing: 2px; text-transform: uppercase;">
                <span style="color: #FF9933;">—</span> Baat Sabki <span style="color: #00C853;">—</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: #1E293B;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">
                ${title}
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #CBD5E1;">
                Namaste <strong style="color: #FFFFFF;">${displayName || 'User'}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                Use the following 6-digit one-time password (OTP) to ${actionDesc}:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #101D2D; border: 2px dashed #FF9933; border-radius: 16px; padding: 20px 36px; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #FF9933; font-family: 'Courier New', Courier, monospace; box-shadow: 0 10px 30px rgba(255, 153, 51, 0.15);">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background-color: #101D2D; border: 1px solid #1E293B; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #94A3B8;">
                  ⏱️ <strong>Valid for 10 minutes.</strong> Never share this code with anyone.
                </p>
                <p style="margin: 0; font-size: 11px; color: #64748B;">
                  VARTA administrators and staff will never ask you for your verification code.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                If you did not request this code, please ignore this email. No changes have been made to your account.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #070E18; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © 2026 VARTA — Baat Sabki. Made with ❤️ for India.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const payload = {
      Messages: [
        {
          From: {
            Email: fromEmail,
            Name: fromName,
          },
          To: [
            {
              Email: toEmail,
              Name: displayName || 'Varta User',
            },
          ],
          Subject: subject,
          HTMLPart: htmlContent,
          CustomID: `VartaOTP-${purpose}`,
          SandboxMode: isSandbox,
        },
      ],
    };

    try {
      this.logger.log(`Dispatching Mailjet OTP email to ${toEmail} (${purpose})...`);
      const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();
      if (!response.ok) {
        this.logger.error(`Mailjet OTP API Error (${response.status}): ${JSON.stringify(data)}`);
        return false;
      }

      this.logger.log(`Mailjet OTP email delivered successfully to ${toEmail}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send OTP email via Mailjet: ${err.message}`, err.stack);
      return false;
    }
  }
}
