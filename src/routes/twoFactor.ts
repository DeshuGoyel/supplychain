import { Router } from 'express';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  getBackupCodes,
  regenerateBackupCodes,
} from '../controllers/twoFactorController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/setup', authenticate, setup2FA);
router.post('/verify', authenticate, verify2FA);
router.post('/disable', authenticate, disable2FA);
router.get('/backup-codes', authenticate, getBackupCodes);
router.post('/backup-codes/regenerate', authenticate, regenerateBackupCodes);

export default router;
