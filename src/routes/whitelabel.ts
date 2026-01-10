import { Router } from 'express';
import { WhiteLabelController } from '../controllers/whitelabelController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const whiteLabelController = new WhiteLabelController();

/**
 * GET /api/whitelabel/settings/:companyId
 * Get white-label settings for a company
 */
router.get('/settings/:companyId', authMiddleware, whiteLabelController.getWhiteLabelSettings.bind(whiteLabelController));

/**
 * PUT /api/whitelabel/settings/:companyId
 * Update white-label settings (MANAGER only)
 */
router.put('/settings/:companyId', authMiddleware, whiteLabelController.updateWhiteLabelSettings.bind(whiteLabelController));

/**
 * POST /api/whitelabel/upload-logo/:companyId
 * Upload company logo
 */
router.post('/upload-logo/:companyId', authMiddleware, whiteLabelController.uploadLogo.bind(whiteLabelController));

/**
 * POST /api/whitelabel/upload-favicon/:companyId
 * Upload favicon
 */
router.post('/upload-favicon/:companyId', authMiddleware, whiteLabelController.uploadFavicon.bind(whiteLabelController));

/**
 * POST /api/whitelabel/validate-domain
 * Validate custom domain availability
 */
router.post('/validate-domain', whiteLabelController.validateCustomDomain.bind(whiteLabelController));

/**
 * GET /api/whitelabel/theme/:domain
 * Get theme settings by custom domain
 */
router.get('/theme/:domain', whiteLabelController.getThemeByDomain.bind(whiteLabelController));

export default router;