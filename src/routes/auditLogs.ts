import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getAuditLogsHandler } from '../controllers/auditLogController';

const router = express.Router();

router.get('/', authMiddleware, getAuditLogsHandler);

export default router;
