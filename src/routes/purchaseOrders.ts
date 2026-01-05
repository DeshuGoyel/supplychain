import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  addLineItem
} from '../controllers/purchaseOrderController';

const router = Router();

router.get('/', authMiddleware, getPurchaseOrders);
router.get('/:id', authMiddleware, getPurchaseOrderById);
router.post('/', authMiddleware, createPurchaseOrder);
router.patch('/:id', authMiddleware, updatePurchaseOrder);
router.delete('/:id', authMiddleware, deletePurchaseOrder);
router.post('/:id/line-items', authMiddleware, addLineItem);

export default router;
