import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTwoFactorSetup, verifyTotp } from '../utils/totp';
import { encryptString, decryptString, generateBackupCodes } from '../utils/crypto';

const prisma = new PrismaClient();

/**
 * Setup 2FA
 * POST /api/auth/2fa/setup
 */
export const setup2FA = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const setup = await generateTwoFactorSetup(user.email);
    const encryptedSecret = encryptString(setup.secret);
    const backupCodes = generateBackupCodes(10);

    await prisma.twoFactorAuth.upsert({
      where: { userId },
      update: {
        secret: encryptedSecret,
        backupCodes: JSON.stringify(backupCodes),
        enabled: false
      },
      create: {
        userId,
        secret: encryptedSecret,
        backupCodes: JSON.stringify(backupCodes),
        enabled: false
      }
    });

    res.status(200).json({
      success: true,
      qrCodeDataUrl: setup.qrCodeDataUrl,
      otpauthUrl: setup.otpauthUrl,
      backupCodes
    });
  } catch (error: any) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA',
      error: error.message
    });
  }
};

/**
 * Verify 2FA token
 * POST /api/auth/2fa/verify
 */
export const verify2FA = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Token required' });
      return;
    }

    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactor) {
      res.status(404).json({ success: false, message: '2FA not setup' });
      return;
    }

    const secret = decryptString(twoFactor.secret);
    const isValid = verifyTotp(token, secret);

    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { enabled: true }
    });

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA',
      error: error.message
    });
  }
};

/**
 * Disable 2FA
 * POST /api/auth/2fa/disable
 */
export const disable2FA = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { enabled: false }
    });

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: error.message
    });
  }
};

/**
 * Generate new backup codes
 * POST /api/auth/2fa/backup-codes
 */
export const generateNewBackupCodes = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactor) {
      res.status(404).json({ success: false, message: '2FA not setup' });
      return;
    }

    const backupCodes = generateBackupCodes(10);

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { backupCodes: JSON.stringify(backupCodes) }
    });

    res.status(200).json({
      success: true,
      backupCodes
    });
  } catch (error: any) {
    console.error('Backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate backup codes',
      error: error.message
    });
  }
};
