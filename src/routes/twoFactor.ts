import { Router } from 'express';
import { 
  enableTwoFactor, 
  verifyTwoFactorSetup, 
  verifyTwoFactorCode, 
  disableTwoFactor, 
  regenerateBackupCodes 
} from '../controllers/twoFactorController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// These routes require standard authentication
router.post('/enable', authMiddleware, enableTwoFactor);
router.post('/verify-setup', authMiddleware, verifyTwoFactorSetup);
router.post('/disable', authMiddleware, disableTwoFactor);
router.post('/backup-codes', authMiddleware, regenerateBackupCodes);

// This route is used during login flow, so it might not have a full JWT yet
// Depending on implementation, it could be public or use a temporary token
router.post('/verify-code', verifyTwoFactorCode);

export default router;
