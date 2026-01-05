import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { auditLogMiddleware, audit2FAEvent, auditConfigChange } from '../middleware/auditLog';
import {
  generateSecret,
  enableTwoFactor,
  disableTwoFactor,
  verify2FACode,
  regenerateBackupCodes,
  is2FAEnabled,
} from '../services/twoFactor';
import {
  getSAMLConfig,
  setSAMLConfig,
  deleteSAMLConfig,
  generateSAMLMetadata,
  isSAMLEnabled,
} from '../services/saml';

const router = express.Router();

// ============= 2FA Routes =============

// Setup 2FA (generate QR code)
router.post('/2fa/setup', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, email, companyId } = (req as any).user;

    const result = await generateSecret(userId, email);

    res.json({
      success: true,
      data: {
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
      },
      message: 'Scan the QR code with your authenticator app and verify to enable 2FA',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to setup 2FA';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Enable 2FA (verify code)
router.post(
  '/2fa/enable',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, companyId } = (req as any).user;
      const { code } = req.body;

      if (!code) {
        res.status(400).json({
          success: false,
          message: 'Verification code is required',
        });
        return;
      }

      const result = await enableTwoFactor(userId, code);

      // Audit log
      await audit2FAEvent(
        companyId,
        userId,
        '2FA_ENABLED',
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        data: {
          backupCodes: result.backupCodes,
        },
        message: 'Two-factor authentication enabled successfully. Save your backup codes in a safe place.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enable 2FA';
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

// Verify 2FA code (during login)
router.post('/2fa/verify', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as any).user;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        message: 'Verification code is required',
      });
      return;
    }

    const verified = await verify2FACode(userId, code);

    if (!verified) {
      res.status(401).json({
        success: false,
        message: 'Invalid verification code',
      });
      return;
    }

    res.json({
      success: true,
      message: '2FA verification successful',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify 2FA code';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Disable 2FA
router.post(
  '/2fa/disable',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, companyId } = (req as any).user;

      await disableTwoFactor(userId);

      // Audit log
      await audit2FAEvent(
        companyId,
        userId,
        '2FA_DISABLED',
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        message: 'Two-factor authentication disabled successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disable 2FA';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// Regenerate backup codes
router.post('/2fa/backup-codes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    const result = await regenerateBackupCodes(userId);

    res.json({
      success: true,
      data: {
        backupCodes: result.backupCodes,
      },
      message: 'Backup codes regenerated successfully. Old codes are now invalid.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate backup codes';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Check 2FA status
router.get('/2fa/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    const enabled = await is2FAEnabled(userId);

    res.json({
      success: true,
      data: {
        enabled,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check 2FA status';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// ============= SAML Routes =============

// Get SAML configuration
router.get('/saml/config', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = (req as any).user;

    const config = await getSAMLConfig(companyId);

    if (!config) {
      res.status(404).json({
        success: false,
        message: 'SAML not configured',
      });
      return;
    }

    // Don't expose the full certificate and sensitive data
    res.json({
      success: true,
      data: {
        id: config.id,
        idpUrl: config.idpUrl,
        entityId: config.entityId,
        status: config.status,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch SAML configuration';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Set SAML configuration
router.post(
  '/saml/config',
  authMiddleware,
  auditLogMiddleware('CONFIG_CHANGE', 'SAMLConfig'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyId, userId } = (req as any).user;
      const { idpUrl, certificate, entityId } = req.body;

      if (!idpUrl || !certificate || !entityId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: idpUrl, certificate, entityId',
        });
        return;
      }

      const config = await setSAMLConfig(companyId, {
        idpUrl,
        certificate,
        entityId,
      });

      // Audit log
      await auditConfigChange(
        companyId,
        userId,
        'SAMLConfig',
        { idpUrl, entityId, action: 'configured' },
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        data: {
          id: config.id,
          idpUrl: config.idpUrl,
          entityId: config.entityId,
          status: config.status,
        },
        message: 'SAML configuration saved successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save SAML configuration';
      const statusCode = message.includes('enterprise tier') ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
);

// Delete SAML configuration
router.delete(
  '/saml/config',
  authMiddleware,
  auditLogMiddleware('DELETE', 'SAMLConfig'),
  async (req: Request, res: Response) => {
    try {
      const { companyId, userId } = (req as any).user;

      await deleteSAMLConfig(companyId);

      // Audit log
      await auditConfigChange(
        companyId,
        userId,
        'SAMLConfig',
        { action: 'deleted' },
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        message: 'SAML configuration deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete SAML configuration';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// Get SAML metadata (for IdP configuration)
router.get('/saml/metadata', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;

    const metadata = generateSAMLMetadata(companyId);

    res.setHeader('Content-Type', 'application/xml');
    res.send(metadata);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate SAML metadata';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Check SAML status
router.get('/saml/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;

    const enabled = await isSAMLEnabled(companyId);

    res.json({
      success: true,
      data: {
        enabled,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check SAML status';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// ============= Audit Logs Routes =============

import { getAuditLogs, getAuditLogById, exportAuditLogs } from '../services/auditLog';

// Get audit logs
router.get('/audit-logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    const filters: any = {};
    
    if (userId) filters.userId = userId as string;
    if (action) filters.action = action as string;
    if (resource) filters.resource = resource as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const result = await getAuditLogs(companyId, filters);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit logs';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Get single audit log
router.get('/audit-logs/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = (req as any).user;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Log ID is required',
      });
      return;
    }

    const log = await getAuditLogById(id, companyId);

    if (!log) {
      res.status(404).json({
        success: false,
        message: 'Audit log not found',
      });
      return;
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit log';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Export audit logs
router.get('/audit-logs/export/csv', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const { startDate, endDate, action, resource } = req.query;

    const filters: any = {};
    
    if (action) filters.action = action as string;
    if (resource) filters.resource = resource as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const logs = await exportAuditLogs(companyId, filters);

    // Convert to CSV
    const headers = ['ID', 'Timestamp', 'Action', 'Resource', 'Resource ID', 'User Name', 'User Email', 'IP Address'];
    const csv = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.action,
        log.resource,
        log.resourceId || '',
        log.userName,
        log.userEmail,
        log.ipAddress || '',
      ].join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export audit logs';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

export default router;
