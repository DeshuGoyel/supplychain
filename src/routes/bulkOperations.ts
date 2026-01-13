import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as bulkOperationController from '../controllers/bulkOperationController';
import expressFileupload from 'express-fileupload';

const router = express.Router();

router.use(authenticateToken);
router.use(expressFileupload());

router.post('/import/inventory', bulkOperationController.importInventory);
router.post('/import/orders', bulkOperationController.importOrders);
router.post('/import/suppliers', bulkOperationController.importSuppliers);
router.post('/bulk/inventory/update', bulkOperationController.bulkUpdateInventory);
router.get('/job/:jobId/status', bulkOperationController.getJobStatus);
router.get('/job/:jobId/results', bulkOperationController.getJobResults);
router.get('/jobs', bulkOperationController.getBulkJobs);
router.get('/export/inventory', bulkOperationController.exportInventory);
router.get('/export/orders', bulkOperationController.exportOrders);
router.get('/export/suppliers', bulkOperationController.exportSuppliers);

export default router;
