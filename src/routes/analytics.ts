import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getKPIs,
  getOTIF,
  getTurns,
  getSupplierAnalytics,
  getLeadTime,
  getCostAnalytics,
  exportAnalytics
} from '../controllers/analyticsController';

const router = Router();

router.get('/kpis', authMiddleware, getKPIs);
router.get('/otif', authMiddleware, getOTIF);
router.get('/turns', authMiddleware, getTurns);
router.get('/suppliers', authMiddleware, getSupplierAnalytics);
router.get('/lead-time', authMiddleware, getLeadTime);
router.get('/cost', authMiddleware, getCostAnalytics);
router.post('/export', authMiddleware, exportAnalytics);

export default router;
