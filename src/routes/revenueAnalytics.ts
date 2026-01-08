import { Router } from 'express';
import {
  getMRR,
  getChurnRate,
  getLTVCAC,
  getCohortAnalysis,
  getExpansionRevenue,
  getRetentionCurve,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/mrr', authenticate, getMRR);
router.get('/churn', authenticate, getChurnRate);
router.get('/ltv-cac', authenticate, getLTVCAC);
router.get('/cohorts', authenticate, getCohortAnalysis);
router.get('/expansion', authenticate, getExpansionRevenue);
router.get('/retention', authenticate, getRetentionCurve);

export default router;
