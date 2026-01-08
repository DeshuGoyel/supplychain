import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export async function setup2FA(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing2FA = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (existing2FA?.enabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `Supply Chain AI (${user.email})`,
      length: 32,
    });

    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await prisma.twoFactorAuth.upsert({
      where: { userId },
      update: {
        secret: encrypt(secret.base32),
        backupCodes: encrypt(JSON.stringify(backupCodes)),
        enabled: false,
      },
      create: {
        userId,
        secret: encrypt(secret.base32),
        backupCodes: encrypt(JSON.stringify(backupCodes)),
        enabled: false,
      },
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
    });
  } catch (error: any) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ error: error.message || 'Failed to setup 2FA' });
  }
}

export async function verify2FA(req: Request, res: Response) {
  try {
    const { token } = req.body;
    const userId = (req as any).user.id;

    const twoFA = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFA) {
      return res.status(404).json({ error: '2FA not setup' });
    }

    const secret = decrypt(twoFA.secret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      const backupCodes = JSON.parse(decrypt(twoFA.backupCodes));
      if (backupCodes.includes(token)) {
        const updatedCodes = backupCodes.filter((code: string) => code !== token);
        await prisma.twoFactorAuth.update({
          where: { userId },
          data: {
            backupCodes: encrypt(JSON.stringify(updatedCodes)),
          },
        });
        return res.json({ success: true, message: 'Backup code verified' });
      }
      return res.status(400).json({ error: 'Invalid token' });
    }

    if (!twoFA.enabled) {
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { enabled: true },
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ error: error.message || 'Failed to verify 2FA' });
  }
}

export async function disable2FA(req: Request, res: Response) {
  try {
    const { password } = req.body;
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { enabled: false },
    });

    res.json({ success: true, message: '2FA disabled' });
  } catch (error: any) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ error: error.message || 'Failed to disable 2FA' });
  }
}

export async function getBackupCodes(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;

    const twoFA = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFA?.enabled) {
      return res.status(404).json({ error: '2FA not enabled' });
    }

    const backupCodes = JSON.parse(decrypt(twoFA.backupCodes));

    res.json({ backupCodes });
  } catch (error: any) {
    console.error('Error getting backup codes:', error);
    res.status(500).json({ error: error.message || 'Failed to get backup codes' });
  }
}

export async function regenerateBackupCodes(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;

    const twoFA = await prisma.twoFactorAuth.findUnique({
      where: { userId },
    });

    if (!twoFA?.enabled) {
      return res.status(404).json({ error: '2FA not enabled' });
    }

    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        backupCodes: encrypt(JSON.stringify(backupCodes)),
      },
    });

    res.json({ backupCodes });
  } catch (error: any) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate backup codes' });
  }
}
