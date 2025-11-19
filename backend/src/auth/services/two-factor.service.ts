import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  /**
   * Generate a secret for 2FA
   */
  generateSecret(
    email: string,
    serviceName: string = 'Content Generator',
  ): {
    secret: string;
    qrCodeUrl: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `${serviceName} (${email})`,
      issuer: serviceName,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || '',
    };
  }

  /**
   * Generate QR code data URL
   */
  async generateQRCode(otpauthUrl: string): Promise<string> {
    return qrcode.toDataURL(otpauthUrl);
  }

  /**
   * Verify 2FA token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });
  }

  /**
   * Generate backup codes (optional)
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}
