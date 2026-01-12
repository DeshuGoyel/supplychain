import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware, requireRole } from '../middleware/auth';
import {
  createWhiteLabelConfig,
  deleteWhiteLabelConfig,
  getWhiteLabelConfig,
  updateWhiteLabelConfig,
} from '../controllers/whiteLabelApiController';

const router = Router();

router.get('/', optionalAuthMiddleware, getWhiteLabelConfig);
router.post('/', authMiddleware, requireRole(['MANAGER']), createWhiteLabelConfig);
router.put('/:id', authMiddleware, requireRole(['MANAGER']), updateWhiteLabelConfig);
router.delete('/:id', authMiddleware, requireRole(['MANAGER']), deleteWhiteLabelConfig);

export default router;
