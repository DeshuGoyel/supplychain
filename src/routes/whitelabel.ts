import { Router } from 'express';
import { 
  getWhitelabelSettings, 
  updateWhitelabelSettings, 
  uploadLogo, 
  uploadFavicon, 
  validateCustomDomain 
} from '../controllers/whitelabelController';
import { authMiddleware, requireRole } from '../middleware/auth';
import fileUpload from 'express-fileupload';

const router = Router();

/**
 * @route   GET /api/whitelabel/settings
 * @desc    Get white-label settings for company
 * @access  Private
 */
router.get('/settings', authMiddleware, getWhitelabelSettings);

/**
 * @route   PUT /api/whitelabel/settings
 * @desc    Update white-label settings for company
 * @access  Private (MANAGER only)
 */
router.put('/settings', authMiddleware, requireRole(['MANAGER']), updateWhitelabelSettings);

/**
 * @route   POST /api/whitelabel/upload-logo
 * @desc    Upload company logo
 * @access  Private (MANAGER only)
 */
router.post(
  '/upload-logo', 
  authMiddleware, 
  requireRole(['MANAGER']), 
  fileUpload({ createParentPath: true }), 
  uploadLogo
);

/**
 * @route   POST /api/whitelabel/upload-favicon
 * @desc    Upload company favicon
 * @access  Private (MANAGER only)
 */
router.post(
  '/upload-favicon', 
  authMiddleware, 
  requireRole(['MANAGER']), 
  fileUpload({ createParentPath: true }), 
  uploadFavicon
);

/**
 * @route   POST /api/whitelabel/validate-domain
 * @desc    Validate custom domain availability
 * @access  Private (MANAGER only)
 */
router.post('/validate-domain', authMiddleware, requireRole(['MANAGER']), validateCustomDomain);

export default router;
