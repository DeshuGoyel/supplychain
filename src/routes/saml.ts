import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { auditAdminActions } from '../middleware/auditLogger';
import { createConfig, deleteConfig, getConfig, getMetadata, testConnection } from '../controllers/samlController';

const router = Router();

router.get('/metadata', authMiddleware, requireRole(['MANAGER']), getMetadata);
router.post('/config', authMiddleware, requireRole(['MANAGER']), auditAdminActions, createConfig);
router.get('/config', authMiddleware, requireRole(['MANAGER']), getConfig);
router.post('/test', authMiddleware, requireRole(['MANAGER']), testConnection);
router.delete('/config', authMiddleware, requireRole(['MANAGER']), auditAdminActions, deleteConfig);

export default router;
