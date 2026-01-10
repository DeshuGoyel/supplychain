import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const auditLogController = new AuditLogController();

/**
 * GET /api/audit-logs/:companyId
 * Get audit logs for a company (MANAGER only)
 */
router.get('/:companyId', authMiddleware, auditLogController.getAuditLogs.bind(auditLogController));

/**
 * GET /api/audit-logs/user/:userId
 * Get audit logs for current user
 */
router.get('/user/:userId', authMiddleware, auditLogController.getUserAuditLogs.bind(auditLogController));

/**
 * GET /api/audit-logs/stats/:companyId
 * Get audit log statistics (MANAGER only)
 */
router.get('/stats/:companyId', authMiddleware, auditLogController.getAuditLogStats.bind(auditLogController));

/**
 * POST /api/audit-logs
 * Create audit log entry (internal use)
 */
router.post('/', auditLogController.createAuditLog.bind(auditLogController));

/**
 * POST /api/audit-logs/cleanup
 * Clean up old audit logs (MANAGER only)
 */
router.post('/cleanup', authMiddleware, auditLogController.cleanupOldLogs.bind(auditLogController));

export default router;