import { Router } from 'express';
import { getInventory, getInventoryMovements, getInventorySummary, reorderInventory } from '../controllers/inventoryController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory with pagination and filtering
 * @access  Private
 */
router.get('/', getInventory);

/**
 * @route   GET /api/inventory/summary
 * @desc    Get inventory summary for dashboard
 * @access  Private
 */
router.get('/summary', getInventorySummary);

/**
 * @route   GET /api/inventory/movements
 * @desc    Get inventory movements
 * @access  Private
 */
router.get('/movements', getInventoryMovements);

/**
 * @route   POST /api/inventory/:id/reorder
 * @desc    Trigger reorder for inventory item
 * @access  Private
 */
router.post('/:id/reorder', reorderInventory);

export default router;
