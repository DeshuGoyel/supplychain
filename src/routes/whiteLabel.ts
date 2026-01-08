import { Router } from 'express';
import {
  getWhiteLabelConfig,
  updateWhiteLabelConfig,
  getPublicWhiteLabelConfig,
  verifyCustomDomain,
  deleteCustomDomain,
} from '../controllers/whiteLabelController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/config', authenticate, getWhiteLabelConfig);
router.post('/config', authenticate, updateWhiteLabelConfig);
router.get('/public/:domain', getPublicWhiteLabelConfig);
router.post('/domain/verify', authenticate, verifyCustomDomain);
router.delete('/domain', authenticate, deleteCustomDomain);

export default router;
