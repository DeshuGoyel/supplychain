import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogInput {
  companyId: string;
  userId?: string | undefined;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'CONFIG_CHANGE' | 'SSO_LOGIN' | '2FA_ENABLED' | '2FA_DISABLED';
  resource: string;
  resourceId?: string | undefined;
  changes?: Record<string, any> | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export const createAuditLog = async (input: AuditLogInput) => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        companyId: input.companyId,
        userId: input.userId || null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId || null,
        changes: input.changes ? JSON.stringify(input.changes) : null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        timestamp: new Date(),
      },
    });

    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logs should not break the main flow
    return null;
  }
};

export const getAuditLogs = async (
  companyId: string,
  filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) => {
  try {
    const where: any = { companyId };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => ({
        ...log,
        changes: log.changes ? JSON.parse(log.changes) : null,
      })),
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
};

export const getAuditLogById = async (id: string, companyId: string) => {
  try {
    const log = await prisma.auditLog.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      return null;
    }

    return {
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
    };
  } catch (error) {
    console.error('Error fetching audit log:', error);
    throw new Error('Failed to fetch audit log');
  }
};

export const exportAuditLogs = async (
  companyId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    resource?: string;
  }
) => {
  try {
    const where: any = { companyId };

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      userName: log.user?.name || 'System',
      userEmail: log.user?.email || 'N/A',
      ipAddress: log.ipAddress,
      changes: log.changes ? JSON.parse(log.changes) : null,
    }));
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw new Error('Failed to export audit logs');
  }
};

export const cleanupOldAuditLogs = async (retentionDays: number = 365) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} audit logs older than ${retentionDays} days`);
    return result;
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    throw new Error('Failed to clean up audit logs');
  }
};
