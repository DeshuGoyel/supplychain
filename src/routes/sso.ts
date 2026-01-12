import { Router } from 'express';
import {
  getSSOStatus,
  configureSSO,
  testSSOConnection,
  updateSSOIntegration,
  initiateGoogleAuth,
  handleGoogleCallback,
  initiateGithubAuth,
  handleGithubCallback,
  initiateMicrosoftAuth,
  handleMicrosoftCallback,
} from '../controllers/ssoController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// SSO/OAuth Configuration (authenticated)
router.get('/status', authMiddleware, getSSOStatus);
router.post('/configure', authMiddleware, requireRole(['MANAGER']), configureSSO);
router.post('/test/:integrationId', authMiddleware, requireRole(['MANAGER']), testSSOConnection);
router.put('/integrations/:integrationId', authMiddleware, requireRole(['MANAGER']), updateSSOIntegration);

// Auth flows (public)
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.get('/github', initiateGithubAuth);
router.get('/github/callback', handleGithubCallback);
router.get('/microsoft', initiateMicrosoftAuth);
router.get('/microsoft/callback', handleMicrosoftCallback);

export default router;
