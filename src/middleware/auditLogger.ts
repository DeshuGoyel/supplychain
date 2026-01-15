import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditRequest extends Request {
  user?: any;
  body?: any;
}

export const auditLogger = (entityType: string) => {
  return async (req: AuditRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;

    let responseData: any = null;
    let statusCode = 200;

    res.send = function (data: any) {
      responseData = data;
      statusCode = res.statusCode;
      return originalSend.call(this, data);
    };

    res.json = function (data: any) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    res.on('finish', async () => {
      try {
        const user = req.user;
        const method = req.method.toUpperCase();
        const isSuccess = statusCode >= 200 && statusCode < 300;

        let action = 'UNKNOWN';
        if (method === 'POST') action = 'CREATE';
        else if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
        else if (method === 'DELETE') action = 'DELETE';
        else if (method === 'GET') action = 'READ';

        const entityId = req.params.id || (req.body?.id) || null;
        const changesBefore = (method === 'PUT' || method === 'PATCH') ? req.body?.originalData : null;
        const changesAfter = (method === 'PUT' || method === 'PATCH' || method === 'POST') ? req.body : null;

        if (user && user.companyId) {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              companyId: user.companyId,
              action,
              entityType,
              entityId,
              changesBefore,
              changesAfter,
              ipAddress: req.ip || req.socket.remoteAddress || null,
              userAgent: req.get('user-agent') || null,
              success: isSuccess,
              timestamp: new Date(),
            },
          });
        }
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });

    next();
  };
};

export const logAuthEvent = async (
  companyId: string,
  userId: string,
  action: string,
  success: boolean,
  req: Request
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        companyId,
        action,
        entityType: 'USER',
        entityId: userId,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
        success,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Auth event logging error:', error);
  }
};
