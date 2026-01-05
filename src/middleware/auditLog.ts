import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../services/auditLog';

interface AuditableRequest extends Request {
  auditLog?: {
    action: string;
    resource: string;
    resourceId?: string;
  };
}

export const auditLogMiddleware = (
  action: string,
  resource: string
) => {
  return async (req: AuditableRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;

    if (!user || !user.companyId) {
      return next();
    }

    // Store audit info for later use
    req.auditLog = {
      action,
      resource,
    };

    // Capture the original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to capture the response
    res.json = function (body: any) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = body?.data?.id || body?.id || req.params.id;

        // Create audit log asynchronously (don't block response)
        createAuditLog({
          companyId: user.companyId,
          userId: user.userId,
          action: (req.auditLog?.action || action) as any,
          resource: req.auditLog?.resource || resource,
          resourceId: resourceId || undefined,
          changes: body?.data || body,
          ipAddress: req.ip || req.socket.remoteAddress || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        }).catch(error => {
          console.error('Failed to create audit log:', error);
        });
      }

      return originalJson(body);
    };

    next();
  };
};

export const auditLoginAttempt = async (
  companyId: string,
  userId: string | undefined,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await createAuditLog({
      companyId,
      userId: userId || undefined,
      action: 'LOGIN',
      resource: 'User',
      resourceId: userId || undefined,
      changes: { success },
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });
  } catch (error) {
    console.error('Failed to audit login attempt:', error);
  }
};

export const audit2FAEvent = async (
  companyId: string,
  userId: string,
  event: '2FA_ENABLED' | '2FA_DISABLED',
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await createAuditLog({
      companyId,
      userId,
      action: event,
      resource: 'TwoFactorAuth',
      resourceId: userId,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });
  } catch (error) {
    console.error('Failed to audit 2FA event:', error);
  }
};

export const auditConfigChange = async (
  companyId: string,
  userId: string,
  resource: string,
  changes: any,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await createAuditLog({
      companyId,
      userId,
      action: 'CONFIG_CHANGE',
      resource,
      changes,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });
  } catch (error) {
    console.error('Failed to audit config change:', error);
  }
};
