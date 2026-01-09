import { Request, Response } from 'express';
import { PrismaClient, AuditAction } from '@prisma/client';
import { TwoFactorService } from '../services/twofa.service';
import { generateToken, verifyToken } from '../utils/jwt';
import { AuditLogService } from '../services/audit.service';

const twofa = new TwoFactorService();
const audit = new AuditLogService();
const prisma = new PrismaClient();

export const getTwoFAStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const enabled = await twofa.isTwoFAEnabled(user.userId);
    res.status(200).json({ success: true, enabled });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get status';
    res.status(500).json({ success: false, message });
  }
};

export const setupTwoFA = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const enabled = await twofa.isTwoFAEnabled(user.userId);

    if (enabled) {
      res.status(200).json({ success: true, enabled: true });
      return;
    }

    const secret = await twofa.generateSecret(user.userId);
    const qrCodeDataUrl = await twofa.generateQRCode(secret.otpauthUrl);

    res.status(200).json({
      success: true,
      enabled: false,
      secret: secret.secret,
      qrCodeDataUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to setup 2FA';
    res.status(500).json({ success: false, message });
  }
};

export const verifyTwoFA = async (req: Request, res: Response) => {
  try {
    const { code, secret, tempToken, useBackupCode } = req.body as {
      code?: string;
      secret?: string;
      tempToken?: string;
      useBackupCode?: boolean;
    };

    if (!code) {
      res.status(400).json({ success: false, message: 'code is required' });
      return;
    }

    // Login flow verification
    if (tempToken) {
      const decoded = verifyToken(tempToken);
      if (!decoded.twoFactorPending) {
        res.status(401).json({ success: false, message: 'Invalid 2FA token' });
        return;
      }

      const userId = decoded.userId;
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      let verified = false;

      if (useBackupCode) {
        verified = await twofa.verifyBackupCode(userId, code);
      } else {
        const storedSecret = await twofa.getDecryptedSecret(userId);
        if (!storedSecret) {
          res.status(400).json({ success: false, message: '2FA not enabled' });
          return;
        }
        verified = twofa.verifyTOTPCode(storedSecret, code);
      }

      if (!verified) {
        res.status(401).json({ success: false, message: 'Invalid 2FA code' });
        return;
      }

      const tokenData = generateToken(
        {
          userId: user.id,
          companyId: user.companyId,
          email: user.email,
          role: user.role,
          twoFactorVerified: true,
        },
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      await audit.logAction({
        companyId: user.companyId,
        userId: user.id,
        action: AuditAction.LOGIN,
        resource: 'auth',
        changes: { method: '2fa' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        success: true,
        token: tokenData.token,
        expiresIn: tokenData.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          company: {
            id: user.company.id,
            name: user.company.name,
            industry: user.company.industry,
            employees: user.company.employees,
          },
        },
      });

      return;
    }

    // Enable flow verification
    const user = (req as any).user;

    if (!secret) {
      res.status(400).json({ success: false, message: 'secret is required when enabling 2FA' });
      return;
    }

    const ok = twofa.verifyTOTPCode(secret, code);
    if (!ok) {
      res.status(401).json({ success: false, message: 'Invalid code' });
      return;
    }

    const backupCodes = twofa.generateBackupCodes();
    await twofa.enableTwoFA(user.userId, secret, backupCodes);

    await audit.logAction({
      companyId: user.companyId,
      userId: user.userId,
      action: AuditAction.ENABLE_2FA,
      resource: 'auth/2fa',
      changes: { enabled: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true, enabled: true, backupCodes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify 2FA';
    res.status(500).json({ success: false, message });
  }
};

export const disableTwoFA = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await twofa.disableTwoFA(user.userId);

    await audit.logAction({
      companyId: user.companyId,
      userId: user.userId,
      action: AuditAction.DISABLE_2FA,
      resource: 'auth/2fa',
      changes: { enabled: false },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to disable 2FA';
    res.status(500).json({ success: false, message });
  }
};

export const regenerateBackupCodes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const codes = await twofa.regenerateBackupCodes(user.userId);

    await audit.logAction({
      companyId: user.companyId,
      userId: user.userId,
      action: AuditAction.UPDATE,
      resource: 'auth/2fa/backup-codes',
      changes: { regenerated: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true, backupCodes: codes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate backup codes';
    res.status(500).json({ success: false, message });
  }
};
