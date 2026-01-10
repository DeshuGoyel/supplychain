import { Router } from 'express';
import { TwoFactorController } from '../controllers/twoFactorController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const twoFactorController = new TwoFactorController();

/**
 * POST /api/auth/2fa/enable/:userId
 * Enable 2FA for user
 */
router.post('/enable/:userId', authMiddleware, twoFactorController.enableTwoFactor.bind(twoFactorController));

/**
 * POST /api/auth/2fa/verify-setup/:userId
 * Verify 2FA setup
 */
router.post('/verify-setup/:userId', authMiddleware, twoFactorController.verifyTwoFactorSetup.bind(twoFactorController));

/**
 * POST /api/auth/2fa/verify-code/:userId
 * Verify 2FA code during login
 */
router.post('/verify-code/:userId', twoFactorController.verifyTwoFactorCode.bind(twoFactorController));

/**
 * POST /api/auth/2fa/backup-codes/:userId
 * Generate new backup codes
 */
router.post('/backup-codes/:userId', authMiddleware, twoFactorController.generateBackupCodes.bind(twoFactorController));

/**
 * POST /api/auth/2fa/disable/:userId
 * Disable 2FA
 */
router.post('/disable/:userId', authMiddleware, twoFactorController.disableTwoFactor.bind(twoFactorController));

/**
 * GET /api/auth/2fa/status/:userId
 * Get 2FA status for user
 */
router.get('/status/:userId', authMiddleware, twoFactorController.getTwoFactorStatus.bind(twoFactorController));

export default router;