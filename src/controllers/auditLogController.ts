import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditLogController {
  /**
   * Get audit logs for a company
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { 
        limit = 50, 
        offset = 0, 
        action, 
        userId, 
        startDate, 
        endDate,
        success 
      } = req.query;

      // Build where clause
      const where: any = { companyId };
      
      if (action) {
        where.action = action as string;
      }
      
      if (userId) {
        where.userId = userId as string;
      }
      
      if (success !== undefined) {
        where.success = success === 'true';
      }
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate as string);
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
              role: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      // Get total count for pagination
      const totalCount = await prisma.auditLog.count({ where });

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            total: totalCount,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: offset + logs.length < totalCount
          }
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get audit logs for current user
   */
  async getUserAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { 
        limit = 50, 
        offset = 0, 
        action, 
        startDate, 
        endDate,
        success 
      } = req.query;

      // Build where clause
      const where: any = { userId };
      
      if (action) {
        where.action = action as string;
      }
      
      if (success !== undefined) {
        where.success = success === 'true';
      }
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate as string);
        }
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      // Get total count for pagination
      const totalCount = await prisma.auditLog.count({ where });

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            total: totalCount,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: offset + logs.length < totalCount
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));

      // Get daily login statistics
      const dailyLogins = await prisma.auditLog.groupBy({
        by: ['timestamp'],
        where: {
          companyId,
          action: 'LOGIN',
          timestamp: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      });

      // Get action breakdown
      const actionBreakdown = await prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          companyId,
          timestamp: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      });

      // Get success/failure rate
      const successRate = await prisma.auditLog.groupBy({
        by: ['success'],
        where: {
          companyId,
          timestamp: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      });

      // Get top users by activity
      const topUsers = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          companyId,
          timestamp: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });

      // Get user details for top users
      const topUsersWithDetails = await Promise.all(
        topUsers.map(async (user) => {
          const userDetails = await prisma.user.findUnique({
            where: { id: user.userId || '' },
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          });
          return {
            ...user,
            user: userDetails
          };
        })
      );

      res.json({
        success: true,
        data: {
          dailyLogins,
          actionBreakdown,
          successRate,
          topUsers: topUsersWithDetails,
          totalEvents: dailyLogins.reduce((sum, day) => sum + day._count.id, 0),
          period: {
            days: parseInt(days as string),
            startDate,
            endDate: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Error fetching audit log stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Create audit log entry (for internal use)
   */
  async createAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const { 
        userId, 
        companyId, 
        action, 
        ipAddress, 
        userAgent, 
        success, 
        details 
      } = req.body;

      const log = await prisma.auditLog.create({
        data: {
          userId,
          companyId,
          action,
          ipAddress,
          userAgent,
          success,
          details
        }
      });

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(req: Request, res: Response): Promise<void> {
    try {
      const { days = 90 } = req.body;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const deleted = await prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      res.json({
        success: true,
        message: `Deleted ${deleted.count} audit log entries older than ${days} days`
      });
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}