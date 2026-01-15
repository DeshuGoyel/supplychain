import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as supplierEnhancedController from '../controllers/supplierEnhancedController';

const router = express.Router();

router.use(authenticateToken);

router.get('/:id/performance', supplierEnhancedController.getSupplierPerformance);
router.post('/comparison', supplierEnhancedController.compareSuppliers);
router.get('/rankings', supplierEnhancedController.getSupplierRankings);
router.post('/:id/metrics/update', supplierEnhancedController.updateSupplierMetrics);
router.get('/abc-analysis', supplierEnhancedController.getABCAnalysis);

export default router;
