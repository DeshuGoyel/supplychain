import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate a new TOTP secret
 * @param email - User's email
 * @returns Object containing base32 secret and otpauth_url
 */
export const generateTOTPSecret = (email: string) => {
  const secret = speakeasy.generateSecret({
    name: `SupplyChainAI (${email})`,
    issuer: 'SupplyChainAI'
  });

  return {
    base32: secret.base32,
    otpauth_url: secret.otpauth_url
  };
};

/**
 * Generate a QR code data URL from an otpauth_url
 * @param otpauthUrl - The otpauth URL
 * @returns Promise resolving to a data URL string
 */
export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify a TOTP code against a secret
 * @param secret - The base32 secret
 * @param token - The 6-digit code to verify
 * @returns boolean indicating if the code is valid
 */
export const verifyTOTPCode = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1 // Allow 30 seconds clock drift
  });
};
