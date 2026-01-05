import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decrypt = (encryptedText: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = speakeasy.generateSecret({ length: 8 }).base32.substring(0, 8);
    codes.push(code);
  }
  return codes;
};

export const generateSecret = async (userId: string, email: string) => {
  try {
    // Check if 2FA is already set up
    const existing = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (existing && existing.enabled) {
      throw new Error('Two-factor authentication is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Supply Chain AI (${email})`,
      issuer: 'Supply Chain AI',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Encrypt secret and backup codes
    const encryptedSecret = encrypt(secret.base32);
    const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));

    // Store in database (not enabled yet)
    await prisma.twoFactorAuth.upsert({
      where: { userId },
      update: {
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        enabled: false,
        updatedAt: new Date(),
      },
      create: {
        userId,
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        enabled: false,
      },
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
    };
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    throw error;
  }
};

export const enableTwoFactor = async (userId: string, code: string) => {
  try {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth) {
      throw new Error('Two-factor authentication not set up');
    }

    if (twoFactorAuth.enabled) {
      throw new Error('Two-factor authentication already enabled');
    }

    // Decrypt secret
    const secret = decrypt(twoFactorAuth.secret);

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      throw new Error('Invalid verification code');
    }

    // Enable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        enabled: true,
        updatedAt: new Date(),
      },
    });

    // Decrypt and return backup codes
    const backupCodes = JSON.parse(decrypt(twoFactorAuth.backupCodes));

    return {
      success: true,
      backupCodes,
    };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    throw error;
  }
};

export const disableTwoFactor = async (userId: string) => {
  try {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth) {
      throw new Error('Two-factor authentication not set up');
    }

    await prisma.twoFactorAuth.delete({
      where: { userId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    throw error;
  }
};

export const verify2FACode = async (userId: string, code: string): Promise<boolean> => {
  try {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth || !twoFactorAuth.enabled) {
      return false;
    }

    // Decrypt secret
    const secret = decrypt(twoFactorAuth.secret);

    // First try TOTP verification
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (verified) {
      return true;
    }

    // If TOTP fails, check backup codes
    const backupCodes = JSON.parse(decrypt(twoFactorAuth.backupCodes));
    const codeIndex = backupCodes.indexOf(code);

    if (codeIndex !== -1) {
      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      
      // Update backup codes
      const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          backupCodes: encryptedBackupCodes,
          updatedAt: new Date(),
        },
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return false;
  }
};

export const regenerateBackupCodes = async (userId: string) => {
  try {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFactorAuth || !twoFactorAuth.enabled) {
      throw new Error('Two-factor authentication not enabled');
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    const encryptedBackupCodes = encrypt(JSON.stringify(backupCodes));

    // Update in database
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        backupCodes: encryptedBackupCodes,
        updatedAt: new Date(),
      },
    });

    return { backupCodes };
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    throw error;
  }
};

export const is2FAEnabled = async (userId: string): Promise<boolean> => {
  try {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    return twoFactorAuth?.enabled || false;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
};
