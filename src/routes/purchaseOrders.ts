import { Router } from 'express';
import { createPurchaseOrder, getPurchaseOrder, updatePurchaseOrderStatus, getPurchaseOrders } from '../controllers/purchaseOrderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/purchase-orders
 * @desc    Get all purchase orders with filters
 * @access  Private
 */
router.get('/', getPurchaseOrders);

/**
 * @route   POST /api/purchase-orders
 * @desc    Create new purchase order
 * @access  Private
 */
router.post('/', createPurchaseOrder);

/**
 * @route   GET /api/purchase-orders/:id
 * @desc    Get purchase order detail
 * @access  Private
 */
router.get('/:id', getPurchaseOrder);

/**
 * @route   PATCH /api/purchase-orders/:id
 * @desc    Update purchase order status
 * @access  Private
 */
router.patch('/:id', updatePurchaseOrderStatus);

export default router;
