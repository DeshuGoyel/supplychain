import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTOTPSecret, generateQRCode, verifyTOTPCode } from '../utils/totp';
import { encrypt, decrypt } from '../utils/encryption';
import { generateBackupCodes, hashBackupCodes } from '../utils/backup-codes';

const prisma = new PrismaClient();

/**
 * Generate TOTP secret
 * POST /api/auth/2fa/enable
 */
export const enableTwoFactor = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { base32, otpauth_url } = generateTOTPSecret(user.email);
    const qrCode = await generateQRCode(otpauth_url!);

    // Store temp secret until verified
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encrypt(base32)
      }
    });

    res.status(200).json({
      success: true,
      qrCode,
      secret: base32 // Optional, for manual entry
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ success: false, message: 'Internal server error enabling 2FA' });
  }
};

/**
 * Verify 2FA QR code scan
 * POST /api/auth/2fa/verify-setup
 */
export const verifyTwoFactorSetup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      res.status(400).json({ success: false, message: '2FA not initiated' });
      return;
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValid = verifyTOTPCode(secret, code);

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid verification code' });
      return;
    }

    // Generate backup codes
    const plainBackupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(plainBackupCodes);

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes)
      }
    });

    // Log the event
    await prisma.auditLog.create({
      data: {
        userId,
        companyId: user.companyId,
        action: '2FA_ENABLED',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes: plainBackupCodes
    });
  } catch (error) {
    console.error('Verify 2FA setup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error verifying 2FA setup' });
  }
};

/**
 * Validate TOTP code
 * POST /api/auth/2fa/verify-code
 */
export const verifyTwoFactorCode = async (req: Request, res: Response): Promise<void> => {
  // This is for login flow, where user is partially authenticated
  // But for now, we'll implement it as a general verification
  try {
    const { userId, code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      res.status(400).json({ success: false, message: '2FA not enabled for this user' });
      return;
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValid = verifyTOTPCode(secret, code);

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid 2FA code' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Code verified'
    });
  } catch (error) {
    console.error('Verify 2FA code error:', error);
    res.status(500).json({ success: false, message: 'Internal server error verifying 2FA code' });
  }
};

/**
 * Disable 2FA
 * POST /api/auth/2fa/disable
 */
export const disableTwoFactor = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Should verify password here for security
    const { comparePassword } = await import('../utils/auth');
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid password' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      }
    });

    // Log the event
    await prisma.auditLog.create({
      data: {
        userId,
        companyId: user.companyId,
        action: '2FA_DISABLED',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ success: false, message: 'Internal server error disabling 2FA' });
  }
};

/**
 * Generate backup codes
 * POST /api/auth/2fa/backup-codes
 */
export const regenerateBackupCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFactorEnabled) {
      res.status(400).json({ success: false, message: '2FA not enabled' });
      return;
    }

    const plainBackupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(plainBackupCodes);

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes)
      }
    });

    res.status(200).json({
      success: true,
      backupCodes: plainBackupCodes
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    res.status(500).json({ success: false, message: 'Internal server error regenerating backup codes' });
  }
};
