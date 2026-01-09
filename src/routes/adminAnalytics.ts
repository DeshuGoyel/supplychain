import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getMRR,
  getARR,
  getChurn,
  getLtvCac,
  getCohorts,
  getExpansion,
  getRetention
} from '../controllers/adminAnalyticsController';

const router = express.Router();

router.get('/mrr', authMiddleware, getMRR);
router.get('/arr', authMiddleware, getARR);
router.get('/churn', authMiddleware, getChurn);
router.get('/ltv-cac', authMiddleware, getLtvCac);
router.get('/cohorts', authMiddleware, getCohorts);
router.get('/expansion', authMiddleware, getExpansion);
router.get('/retention', authMiddleware, getRetention);

export default router;
