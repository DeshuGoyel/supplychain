import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { auditAdminActions } from '../middleware/auditLogger';
import { exportAuditLogs, getAuditLogDetail, listAuditLogs } from '../controllers/auditController';

const router = Router();

router.get('/', authMiddleware, requireRole(['MANAGER']), listAuditLogs);
router.get('/:id', authMiddleware, requireRole(['MANAGER']), getAuditLogDetail);
router.post('/export', authMiddleware, requireRole(['MANAGER']), auditAdminActions, exportAuditLogs);

export default router;
