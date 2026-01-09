import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  generateNewBackupCodes
} from '../controllers/twoFactorController';

const router = express.Router();

router.post('/setup', authMiddleware, setup2FA);
router.post('/verify', authMiddleware, verify2FA);
router.post('/disable', authMiddleware, disable2FA);
router.post('/backup-codes', authMiddleware, generateNewBackupCodes);

export default router;
