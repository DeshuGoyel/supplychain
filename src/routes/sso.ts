import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { samlService } from '../services/saml';
import { twoFactorAuthService } from '../services/2fa';
import { auditLogService } from '../services/auditLog';
import prisma from '../utils/prisma';

const router = Router();

router.use(authMiddleware);

router.post('/saml/config', requireRole(['MANAGER']), async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = (req as any).user;
    const config = req.body;

    const updated = await samlService.setSAMLConfig(companyId, config);

    const logEntry: any = {
      companyId,
      userId,
      action: 'UPDATE',
      resource: 'SAMLConfig',
      changes: config,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      data: updated
    });
    return;
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to configure SAML'
    });
    return;
  }
});

router.get('/saml/config', async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const config = await samlService.getSAMLConfig(companyId);

    if (!config) {
      res.status(404).json({
        success: false,
        message: 'SAML configuration not found'
      });
      return;
    }

    res.json({
      success: true,
      data: config
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get SAML configuration'
    });
    return;
  }
});

router.get('/saml/metadata', async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const metadata = await samlService.generateSAMLMetadata(companyId);

    res.setHeader('Content-Type', 'application/xml');
    res.send(metadata);
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate SAML metadata'
    });
    return;
  }
});

router.post('/saml/disable', requireRole(['MANAGER']), async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = (req as any).user;

    await samlService.disableSAML(companyId);

    const logEntry: any = {
      companyId,
      userId,
      action: 'UPDATE',
      resource: 'SAMLConfig',
      changes: { status: 'inactive' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      message: 'SAML disabled successfully'
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disable SAML'
    });
    return;
  }
});

router.post('/2fa/setup', async (req: Request, res: Response) => {
  try {
    const { userId, email, companyId } = (req as any).user;

    const setup = await twoFactorAuthService.generateSecret(userId, email);

    const logEntry: any = {
      companyId,
      userId,
      action: 'CREATE',
      resource: 'TwoFactorAuth',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      data: setup
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA'
    });
    return;
  }
});

router.post('/2fa/enable', async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = (req as any).user;
    const { token } = req.body;

    const result = await twoFactorAuthService.enableTwoFactor(userId, token);

    if (!result.verified) {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to enable 2FA'
      });
      return;
    }

    const logEntry: any = {
      companyId,
      userId,
      action: 'UPDATE',
      resource: 'TwoFactorAuth',
      changes: { enabled: true },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA'
    });
    return;
  }
});

router.post('/2fa/disable', async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = (req as any).user;
    const { password } = req.body;

    const result = await twoFactorAuthService.disableTwoFactor(userId, password);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to disable 2FA'
      });
      return;
    }

    const logEntry: any = {
      companyId,
      userId,
      action: 'UPDATE',
      resource: 'TwoFactorAuth',
      changes: { enabled: false },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
    return;
  }
});

router.post('/2fa/verify', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { token } = req.body;

    const result = await twoFactorAuthService.verify2FACode(userId, token);

    res.json({
      success: result.verified,
      message: result.verified ? 'Code verified successfully' : result.error
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA code'
    });
    return;
  }
});

router.get('/2fa/status', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const status = await twoFactorAuthService.getTwoFactorStatus(userId);

    res.json({
      success: true,
      data: status
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status'
    });
    return;
  }
});

router.post('/2fa/backup-codes', async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = (req as any).user;

    const result = await twoFactorAuthService.regenerateBackupCodes(userId);

    if (result.error) {
      res.status(400).json({
        success: false,
        message: result.error
      });
      return;
    }

    const logEntry: any = {
      companyId,
      userId,
      action: 'UPDATE',
      resource: 'TwoFactorAuth',
      changes: { backupCodesRegenerated: true },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      data: { codes: result.codes }
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate backup codes'
    });
    return;
  }
});

export default router;
