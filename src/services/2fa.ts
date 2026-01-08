import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerify {
  verified: boolean;
  error?: string;
}

export class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;

  private constructor() {}

  static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-32-bytes-long', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-32-bytes-long', 'salt', 32);
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  async generateSecret(userId: string, email: string): Promise<TwoFactorSetup> {
    const secret = authenticator.generateSecret();
    const serviceName = process.env.APP_NAME || 'Supply Chain AI';

    const qrCodeUrl = authenticator.keyuri(email, serviceName, secret);
    const backupCodes = this.generateBackupCodes();

    // Store encrypted secret and backup codes temporarily
    const encryptedSecret = this.encrypt(secret);
    const encryptedBackupCodes = backupCodes.map(code => this.encrypt(code));

    const existing = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (existing) {
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          secret: encryptedSecret,
          backupCodes: encryptedBackupCodes,
          enabled: false
        }
      });
    } else {
      await prisma.twoFactorAuth.create({
        data: {
          userId,
          secret: encryptedSecret,
          backupCodes: encryptedBackupCodes,
          enabled: false
        }
      });
    }

    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  async enableTwoFactor(userId: string, token: string): Promise<TwoFactorVerify> {
    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactor) {
      return { verified: false, error: 'Two-factor authentication not set up' };
    }

    try {
      const secret = this.decrypt(twoFactor.secret);
      const isValid = authenticator.verify({ token, secret });

      if (!isValid) {
        return { verified: false, error: 'Invalid verification code' };
      }

      // Enable 2FA after successful verification
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { enabled: true }
      });

      return { verified: true };
    } catch (error) {
      return { verified: false, error: 'Failed to verify code' };
    }
  }

  async disableTwoFactor(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    // In production, verify password first
    // For now, we'll skip password verification

    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactor) {
      return { success: false, error: 'Two-factor authentication not enabled' };
    }

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { enabled: false }
    });

    return { success: true };
  }

  async verify2FACode(userId: string, token: string): Promise<TwoFactorVerify> {
    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactor || !twoFactor.enabled) {
      return { verified: false, error: 'Two-factor authentication not enabled' };
    }

    try {
      const secret = this.decrypt(twoFactor.secret);
      const isValid = authenticator.verify({ token, secret });

      if (isValid) {
        return { verified: true };
      }

      // Check backup codes
      const decryptedBackupCodes = twoFactor.backupCodes.map(code => this.decrypt(code));
      const backupCodeIndex = decryptedBackupCodes.findIndex(code => code.toUpperCase() === token.toUpperCase());

      if (backupCodeIndex !== -1) {
        // Remove used backup code
        const updatedBackupCodes = [...twoFactor.backupCodes];
        updatedBackupCodes.splice(backupCodeIndex, 1);

        await prisma.twoFactorAuth.update({
          where: { userId },
          data: { backupCodes: updatedBackupCodes }
        });

        return { verified: true };
      }

      return { verified: false, error: 'Invalid verification code' };
    } catch (error) {
      return { verified: false, error: 'Failed to verify code' };
    }
  }

  async getTwoFactorStatus(userId: string): Promise<{ enabled: boolean; setupComplete: boolean }> {
    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    return {
      enabled: twoFactor?.enabled || false,
      setupComplete: !!twoFactor
    };
  }

  async regenerateBackupCodes(userId: string): Promise<{ codes: string[]; error?: string }> {
    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactor || !twoFactor.enabled) {
      return { codes: [], error: 'Two-factor authentication not enabled' };
    }

    const newBackupCodes = this.generateBackupCodes();
    const encryptedBackupCodes = newBackupCodes.map(code => this.encrypt(code));

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { backupCodes: encryptedBackupCodes }
    });

    return { codes: newBackupCodes };
  }

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    return twoFactor?.enabled || false;
  }
}

export const twoFactorAuthService = TwoFactorAuthService.getInstance();
