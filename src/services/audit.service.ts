import { AuditAction, Prisma, PrismaClient } from '@prisma/client';
import { stringify } from 'csv-stringify/sync';

const prisma = new PrismaClient();

export interface AuditLogFilters {
  action?: AuditAction;
  userId?: string;
  resource?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export class AuditLogService {
  async logAction(params: {
    companyId: string;
    userId?: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    changes?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId ?? null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? null,
        changes: params.changes,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async getAuditLogs(companyId: string, filters: AuditLogFilters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(200, Math.max(1, filters.limit || 50));

    const where: Prisma.AuditLogWhereInput = {
      companyId,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.resource ? { resource: { contains: filters.resource, mode: 'insensitive' } } : {}),
      ...(filters.from || filters.to
        ? {
            timestamp: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, email: true, name: true, role: true } },
        },
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchAuditLogs(companyId: string, query: string, page = 1, limit = 50) {
    const safeQuery = query.trim();
    const where: Prisma.AuditLogWhereInput = {
      companyId,
      OR: [
        { resource: { contains: safeQuery, mode: 'insensitive' } },
        { resourceId: { contains: safeQuery, mode: 'insensitive' } },
      ],
    };

    const [total, data] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportAuditLogs(companyId: string) {
    const logs = await prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { email: true, name: true } } },
      take: 10000,
    });

    const records = logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId || '',
      userEmail: l.user?.email || '',
      userName: l.user?.name || '',
      ipAddress: l.ipAddress || '',
      userAgent: l.userAgent || '',
      changes: l.changes ? JSON.stringify(l.changes) : '',
    }));

    return stringify(records, {
      header: true,
      columns: [
        'id',
        'timestamp',
        'action',
        'resource',
        'resourceId',
        'userEmail',
        'userName',
        'ipAddress',
        'userAgent',
        'changes',
      ],
    });
  }
}
