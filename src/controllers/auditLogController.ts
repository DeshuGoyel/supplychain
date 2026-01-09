import { Response } from 'express';
import { getAuditLogs } from '../utils/auditLog';

/**
 * Get audit logs
 * GET /api/audit-logs
 */
export const getAuditLogsHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId = req.user.companyId;
    const { userId, resource, action, limit, offset } = req.query;

    const logs = await getAuditLogs(companyId, {
      userId: userId as string,
      resource: resource as string,
      action: action as string,
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0
    });

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs',
      error: error.message
    });
  }
};
