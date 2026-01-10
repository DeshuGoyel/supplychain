import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export interface TOTPSecret {
  ascii: string;
  hex: string;
  base32: string;
  otpauth_url: string;
}

export interface TOTPVerify {
  token: string;
  secret: string;
  encoding: 'ascii' | 'hex' | 'base32';
}

/**
 * Generate a TOTP secret for 2FA
 */
export function generateTOTPSecret(userEmail: string, serviceName: string = 'Supply Chain AI'): TOTPSecret {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `${serviceName} (${userEmail})`,
    issuer: 'Supply Chain AI',
  });

  return {
    ascii: secret.ascii,
    hex: secret.hex,
    base32: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
}

/**
 * Generate a QR code for TOTP setup
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP token
 */
export function verifyTOTP(token: string, secret: string, window: number = 1): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window,
  });
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-digit backup codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Validate backup code format
 */
export function validateBackupCode(code: string): boolean {
  // Backup codes should be 8 alphanumeric characters
  const pattern = /^[A-Z0-9]{8}$/;
  return pattern.test(code);
}

/**
 * Generate a secure random string for encryption keys
 */
export function generateSecureToken(length: number = 32): string {
  return require('crypto').randomBytes(length).toString('hex');
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string, salt: string): string {
  const crypto = require('crypto');
  return crypto.pbkdf2Sync(code, salt, 10000, 64, 'sha512').toString('hex');
}