import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { auditAdminActions } from '../middleware/auditLogger';
import {
  disableTwoFA,
  getTwoFAStatus,
  regenerateBackupCodes,
  setupTwoFA,
  verifyTwoFA,
} from '../controllers/twofaController';

const router = Router();

router.get('/status', authMiddleware, getTwoFAStatus);
router.post('/setup', authMiddleware, setupTwoFA);
router.post('/verify', optionalAuthMiddleware, verifyTwoFA);
router.post('/disable', authMiddleware, auditAdminActions, disableTwoFA);
router.post('/backup-codes', authMiddleware, auditAdminActions, regenerateBackupCodes);

export default router;
