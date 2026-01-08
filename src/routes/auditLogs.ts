import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { auditLogService } from '../services/auditLog';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const { userId, action, resource, resourceId, limit, offset, startDate, endDate } = req.query;

    const options: any = {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    };

    if (userId) options.userId = userId as string;
    if (action) options.action = action as string;
    if (resource) options.resource = resource as string;
    if (resourceId) options.resourceId = resourceId as string;
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const result = await auditLogService.getAuditLogs(companyId, options);

    res.json({
      success: true,
      data: result
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs'
    });
    return;
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const log = await auditLogService.getAuditLogById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get audit log'
    });
  }
});

router.delete('/cleanup', requireRole(['MANAGER']), async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = (req as any).user;
    const { retentionDays } = req.query;

    const days = retentionDays ? parseInt(retentionDays as string) : 365;
    const count = await auditLogService.deleteOldAuditLogs(days);

    const logEntry: any = {
      companyId,
      userId,
      action: 'DELETE',
      resource: 'AuditLog',
      changes: { deletedCount: count, retentionDays: days },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      message: `Deleted ${count} old audit logs`,
      data: { deletedCount: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup audit logs'
    });
  }
});

router.get('/user/:userId/activity', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) start = new Date(startDate as string);
    if (endDate) end = new Date(endDate as string);

    const activity = await auditLogService.getUserActivity(userId, start, end);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user activity'
    });
  }
});

export default router;
