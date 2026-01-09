import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  companyId: string;
  userId: string;
  action: string; // CREATE, UPDATE, DELETE, LOGIN, EXPORT, etc.
  resource: string; // User, Inventory, Order, etc.
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: entry.companyId,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId || null,
        changes: entry.changes ? JSON.stringify(entry.changes) : null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

export const getAuditLogs = async (
  companyId: string,
  options?: {
    userId?: string;
    resource?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }
) => {
  const where: any = { companyId };

  if (options?.userId) where.userId = options.userId;
  if (options?.resource) where.resource = options.resource;
  if (options?.action) where.action = options.action;

  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0
  });
};
