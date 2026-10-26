import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Fast2SmsSendOtpResult {
  success: boolean;
  message: string;
  simulated?: boolean;
  requestId?: string;
}

@Injectable()
export class Fast2SmsService {
  private readonly logger = new Logger(Fast2SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  public isConfigured(): boolean {
    const apiKey = this.configService.get<string>('FAST2SMS_API_KEY')?.trim();
    return !!apiKey;
  }

  /**
   * Send 6-digit OTP via Fast2SMS Quick SMS Route (route: 'q', requires no DLT registration)
   * @param fullPhone Full phone with country code (e.g. +919023789034)
   * @param otp 6-digit verification code
   */
  async sendOtp(fullPhone: string, otp: string): Promise<Fast2SmsSendOtpResult> {
    const apiKey = this.configService.get<string>('FAST2SMS_API_KEY')?.trim();

    // Extract 10-digit Indian mobile number
    const digitsOnly = fullPhone.replace(/\D/g, '');
    const mobile10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;

    if (!apiKey) {
      return {
        success: false,
        message: 'FAST2SMS_API_KEY is not configured',
      };
    }

    try {
      const message = `Your VARTA verification code is ${otp}. Valid for 10 minutes. Do not share it with anyone.`;

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message,
          numbers: mobile10,
        }),
      });

      const data = (await response.json()) as {
        return?: boolean;
        request_id?: string;
        message?: string | string[];
        status_code?: number;
      };

      if (data.return === true) {
        this.logger.log(`[Fast2SMS] Successfully sent SMS OTP to ${mobile10} (Request ID: ${data.request_id || 'N/A'})`);
        return {
          success: true,
          requestId: data.request_id,
          message: 'SMS OTP dispatched successfully via Fast2SMS',
        };
      }

      const errMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Fast2SMS dispatch error';
      this.logger.warn(`[Fast2SMS] Failed to send SMS to ${mobile10}: ${errMsg} (Status code: ${data.status_code})`);

      return {
        success: false,
        message: `Fast2SMS error: ${errMsg}`,
      };
    } catch (err: any) {
      this.logger.error(`[Fast2SMS] Network exception sending SMS to ${mobile10}: ${err.message}`);
      return {
        success: false,
        message: `Fast2SMS connection error: ${err.message}`,
      };
    }
  }
}
