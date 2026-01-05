import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getLowStock
} from '../controllers/inventoryController';

const router = Router();

router.get('/', authMiddleware, getInventory);
router.get('/low-stock', authMiddleware, getLowStock);
router.get('/:id', authMiddleware, getInventoryById);
router.post('/', authMiddleware, createInventory);
router.patch('/:id', authMiddleware, updateInventory);
router.delete('/:id', authMiddleware, deleteInventory);

export default router;
