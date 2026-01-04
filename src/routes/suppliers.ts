import { Router } from 'express';
import { getSuppliers, getSupplierDetail, createSupplier, updateSupplier, getSupplierPOs } from '../controllers/supplierController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/suppliers
 * @desc    Get all suppliers
 * @access  Private
 */
router.get('/', getSuppliers);

/**
 * @route   POST /api/suppliers
 * @desc    Create new supplier
 * @access  Private
 */
router.post('/', createSupplier);

/**
 * @route   GET /api/suppliers/:id
 * @desc    Get supplier detail
 * @access  Private
 */
router.get('/:id', getSupplierDetail);

/**
 * @route   PATCH /api/suppliers/:id
 * @desc    Update supplier
 * @access  Private
 */
router.patch('/:id', updateSupplier);

/**
 * @route   GET /api/suppliers/:id/pos
 * @desc    Get supplier purchase orders
 * @access  Private
 */
router.get('/:id/pos', getSupplierPOs);

export default router;
