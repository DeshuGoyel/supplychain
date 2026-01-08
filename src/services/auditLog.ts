import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  companyId: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  changes?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogService {
  private static instance: AuditLogService;

  private constructor() {}

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    const createData: any = {
      companyId: entry.companyId,
      action: entry.action,
      resource: entry.resource,
      changes: entry.changes ? JSON.stringify(entry.changes) : null
    };

    if (entry.userId !== undefined) createData.userId = entry.userId;
    if (entry.resourceId !== undefined) createData.resourceId = entry.resourceId;
    if (entry.ipAddress !== undefined) createData.ipAddress = entry.ipAddress;
    if (entry.userAgent !== undefined) createData.userAgent = entry.userAgent;

    await prisma.auditLog.create({
      data: createData
    });
  }

  async getAuditLogs(companyId: string, options?: {
    userId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.action) {
      where.action = options.action;
    }

    if (options?.resource) {
      where.resource = options.resource;
    }

    if (options?.resourceId) {
      where.resourceId = options.resourceId;
    }

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) {
        where.timestamp.gte = options.startDate;
      }
      if (options.endDate) {
        where.timestamp.lte = options.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs: logs.map(log => ({
        ...log,
        changes: log.changes ? JSON.parse(log.changes) : null
      })),
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0
    };
  }

  async getAuditLogById(id: string) {
    const log = await prisma.auditLog.findUnique({
      where: { id }
    });

    if (!log) {
      return null;
    }

    return {
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null
    };
  }

  async deleteOldAuditLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }

  async getUserActivity(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    return logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null
    }));
  }
}

export const auditLogService = AuditLogService.getInstance();
