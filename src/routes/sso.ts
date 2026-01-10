import { Router } from 'express';
import { SSOController } from '../controllers/ssoController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const ssoController = new SSOController();

/**
 * GET /api/sso/status/:companyId
 * Get SSO configuration status for company
 */
router.get('/status/:companyId', authMiddleware, ssoController.getSSOStatus.bind(ssoController));

/**
 * POST /api/sso/configure/:companyId
 * Configure SSO for company (MANAGER only)
 */
router.post('/configure/:companyId', authMiddleware, ssoController.configureSSO.bind(ssoController));

/**
 * POST /api/sso/test/:companyId/:provider
 * Test SSO connection
 */
router.post('/test/:companyId/:provider', authMiddleware, ssoController.testSSOConnection.bind(ssoController));

/**
 * DELETE /api/sso/disable/:companyId/:provider
 * Disable SSO for company (MANAGER only)
 */
router.delete('/disable/:companyId/:provider', authMiddleware, ssoController.disableSSO.bind(ssoController));

/**
 * GET /api/sso/providers
 * Get list of available SSO providers
 */
router.get('/providers', ssoController.getAvailableProviders.bind(ssoController));

export default router;