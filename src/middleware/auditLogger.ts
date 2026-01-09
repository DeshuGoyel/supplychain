import { NextFunction, Request, Response } from 'express';
import { AuditAction } from '@prisma/client';
import { AuditLogService } from '../services/audit.service';

const service = new AuditLogService();

const mapMethodToAction = (method: string): AuditAction | null => {
  if (method === 'POST') return AuditAction.CREATE;
  if (method === 'PUT' || method === 'PATCH') return AuditAction.UPDATE;
  if (method === 'DELETE') return AuditAction.DELETE;
  return null;
};

const redact = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (['password', 'secret', 'certificate', 'backupCodes', 'token'].includes(k)) {
      out[k] = '[REDACTED]';
      continue;
    }
    out[k] = redact(v);
  }
  return out;
};

export const auditAdminActions = (req: Request, res: Response, next: NextFunction) => {
  const action = mapMethodToAction(req.method);
  if (!action) return next();

  const user = (req as any).user;

  res.on('finish', async () => {
    try {
      if (!user?.companyId || res.statusCode >= 400) return;

      await service.logAction({
        companyId: user.companyId,
        userId: user.userId,
        action,
        resource: `${req.baseUrl}${req.path}`,
        changes: {
          body: redact(req.body),
          query: redact(req.query),
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (error) {
      // Swallow audit errors
    }
  });

  next();
};
