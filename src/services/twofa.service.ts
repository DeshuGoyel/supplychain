import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { decryptString, encryptString } from '../utils/encryption';

const prisma = new PrismaClient();

const generateHumanCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet.charAt(bytes[i] % alphabet.length);
  }
  return out;
};

export class TwoFactorService {
  async generateSecret(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${process.env.TWOFA_ISSUER || 'SCACA'} (${user.email})`,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      throw new Error('Failed to generate secret');
    }

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      email: user.email,
    };
  }

  async generateQRCode(otpauthUrl: string) {
    return QRCode.toDataURL(otpauthUrl, { type: 'image/png' });
  }

  verifyTOTPCode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
  }

  generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => generateHumanCode());
  }

  async enableTwoFA(userId: string, secret: string, backupCodes: string[]) {
    const encryptedSecret = encryptString(secret);
    const encryptedBackupCodes = encryptString(JSON.stringify(backupCodes));

    return prisma.twoFactorAuth.upsert({
      where: { userId },
      create: {
        userId,
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        enabled: true,
        enabledAt: new Date(),
      },
      update: {
        secret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        enabled: true,
        enabledAt: new Date(),
      },
    });
  }

  async disableTwoFA(userId: string) {
    await prisma.twoFactorAuth.deleteMany({ where: { userId } });
    return true;
  }

  async isTwoFAEnabled(userId: string): Promise<boolean> {
    const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });
    return Boolean(record?.enabled);
  }

  async getDecryptedSecret(userId: string): Promise<string | null> {
    const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });
    if (!record?.enabled) return null;
    return decryptString(record.secret);
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });
    if (!record?.enabled) return false;

    const decrypted = decryptString(record.backupCodes);
    const codes = JSON.parse(decrypted) as string[];

    const idx = codes.findIndex((c) => c.toUpperCase() === code.toUpperCase());
    if (idx === -1) return false;

    codes.splice(idx, 1);

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        backupCodes: encryptString(JSON.stringify(codes)),
        lastUsedAt: new Date(),
      },
    });

    return true;
  }

  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });
    if (!record?.enabled) throw new Error('2FA is not enabled');

    const codes = this.generateBackupCodes();
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { backupCodes: encryptString(JSON.stringify(codes)) },
    });

    return codes;
  }
}
