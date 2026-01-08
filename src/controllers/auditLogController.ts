import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAuditLog(
  companyId: string,
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null,
  changes: any,
  req?: Request
) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action,
        resource,
        resourceId,
        changes: changes ? JSON.stringify(changes) : null,
        ipAddress: req?.ip || null,
        userAgent: req?.headers['user-agent'] || null,
      },
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;
    const {
      action,
      resource,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const where: any = { companyId };

    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs: logs.map((log) => ({
        ...log,
        changes: log.changes ? JSON.parse(log.changes) : null,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
}

export async function getAuditLogStats(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.auditLog.findMany({
      where: {
        companyId,
        timestamp: { gte: startDate },
      },
    });

    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};
    const userActivity: Record<string, number> = {};

    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
      if (log.userId) {
        userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
      }
    });

    res.json({
      totalLogs: logs.length,
      actionCounts,
      resourceCounts,
      topUsers: Object.entries(userActivity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count })),
    });
  } catch (error: any) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch audit log stats' });
  }
}

export async function exportAuditLogs(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;
    const { startDate, endDate } = req.query;

    const where: any = { companyId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    const csv = [
      'Timestamp,Action,Resource,Resource ID,User ID,IP Address,Changes',
      ...logs.map((log) =>
        [
          log.timestamp.toISOString(),
          log.action,
          log.resource,
          log.resourceId || '',
          log.userId || '',
          log.ipAddress || '',
          log.changes ? JSON.stringify(log.changes).replace(/,/g, ';') : '',
        ].join(',')
      ),
    ].join('\n');

    createAuditLog(
      companyId,
      (req as any).user.id,
      'EXPORT',
      'AuditLog',
      null,
      { format: 'csv', count: logs.length },
      req
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: error.message || 'Failed to export audit logs' });
  }
}
