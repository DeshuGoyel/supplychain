import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { userId, action, startDate, endDate, success } = req.query;

    const where: any = { companyId };

    if (typeof userId === 'string' && userId) {
      where.userId = userId;
    }

    if (typeof action === 'string' && action) {
      where.action = action;
    }

    if (typeof success === 'string') {
      if (success === 'true') where.success = true;
      if (success === 'false') where.success = false;
    }

    if (typeof startDate === 'string' || typeof endDate === 'string') {
      where.timestamp = {};
      if (typeof startDate === 'string' && startDate) {
        const parsed = new Date(startDate);
        if (!Number.isNaN(parsed.getTime())) where.timestamp.gte = parsed;
      }
      if (typeof endDate === 'string' && endDate) {
        const parsed = new Date(endDate);
        if (!Number.isNaN(parsed.getTime())) where.timestamp.lte = parsed;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.auditLog.count({ where });

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching audit logs' });
  }
};
