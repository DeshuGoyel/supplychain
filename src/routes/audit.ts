import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, requireRole(['MANAGER']), getAuditLogs);

export default router;
