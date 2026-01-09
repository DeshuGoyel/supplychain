import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getConfig,
  updateConfig,
  getPublicConfig,
  setCustomDomain,
  verifyCustomDomain,
  removeCustomDomain
} from '../controllers/whiteLabelController';

const router = express.Router();

// Public for custom domain theming
router.get('/public/:domain', getPublicConfig);

router.get('/config', authMiddleware, getConfig);
router.post('/config', authMiddleware, updateConfig);
router.post('/domain', authMiddleware, setCustomDomain);
router.post('/verify-domain', authMiddleware, verifyCustomDomain);
router.delete('/domain', authMiddleware, removeCustomDomain);

export default router;
