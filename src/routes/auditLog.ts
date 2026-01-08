import { Router } from 'express';
import {
  getAuditLogs,
  getAuditLogStats,
  exportAuditLogs,
} from '../controllers/auditLogController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAuditLogs);
router.get('/stats', authenticate, getAuditLogStats);
router.get('/export', authenticate, exportAuditLogs);

export default router;
