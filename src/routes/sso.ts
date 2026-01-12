import { Router } from 'express';
import { 
  getSSOStatus, 
  configureSSO, 
  initiateGoogleAuth, 
  handleGoogleCallback, 
  initiateMicrosoftAuth, 
  handleMicrosoftCallback,
  deleteSSOIntegration
} from '../controllers/ssoController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// SSO Configuration (authenticated)
router.get('/status', authMiddleware, getSSOStatus);
router.post('/configure', authMiddleware, requireRole(['MANAGER']), configureSSO);
router.delete('/integrations/:id', authMiddleware, requireRole(['MANAGER']), deleteSSOIntegration);

// Auth flows (public)
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.get('/microsoft', initiateMicrosoftAuth);
router.get('/microsoft/callback', handleMicrosoftCallback);

export default router;
