import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  getSupplierPOs,
  getSupplierPerformance
} from '../controllers/supplierController';

const router = Router();

router.get('/', authMiddleware, getSuppliers);
router.get('/performance', authMiddleware, getSupplierPerformance);
router.get('/:id', authMiddleware, getSupplierById);
router.post('/', authMiddleware, createSupplier);
router.patch('/:id', authMiddleware, updateSupplier);
router.get('/:id/pos', authMiddleware, getSupplierPOs);

export default router;
