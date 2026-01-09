import { Request, Response } from 'express';
import { AuditAction, PrismaClient } from '@prisma/client';
import { AuditLogService } from '../services/audit.service';

const service = new AuditLogService();
const prisma = new PrismaClient();

export const listAuditLogs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;

    const {
      page,
      limit,
      action,
      userId,
      resource,
      from,
      to,
      q,
    } = req.query as Record<string, string>;

    if (q) {
      const result = await service.searchAuditLogs(companyId, q, Number(page) || 1, Number(limit) || 50);
      res.status(200).json({ success: true, ...result });
      return;
    }

    const result = await service.getAuditLogs(companyId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      action: action ? (action as AuditAction) : undefined,
      userId: userId || undefined,
      resource: resource || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list audit logs';
    res.status(500).json({ success: false, message });
  }
};

export const getAuditLogDetail = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;
    const id = req.params.id;

    const log = await prisma.auditLog.findFirst({
      where: { id, companyId },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });

    if (!log) {
      res.status(404).json({ success: false, message: 'Audit log not found' });
      return;
    }

    res.status(200).json({ success: true, log });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get audit log detail';
    res.status(500).json({ success: false, message });
  }
};

export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;

    const csv = await service.exportAuditLogs(companyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export audit logs';
    res.status(500).json({ success: false, message });
  }
};
