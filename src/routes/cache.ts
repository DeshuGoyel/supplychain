import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import * as cacheController from '../controllers/cacheController';

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', cacheController.getCacheStats);
router.post('/clear', requireRole(['MANAGER']), cacheController.clearAllCache);
router.post('/clear/:type', requireRole(['MANAGER']), cacheController.clearCacheByType);

export default router;
