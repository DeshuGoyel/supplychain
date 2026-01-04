import { Router } from 'express';
import { getShipments, getShipmentDetail, getDelayedShipments, getCarrierPerformance } from '../controllers/shipmentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/shipments
 * @desc    Get active shipments
 * @access  Private
 */
router.get('/', getShipments);

/**
 * @route   GET /api/shipments/exceptions
 * @desc    Get delayed shipments (exceptions)
 * @access  Private
 */
router.get('/exceptions', getDelayedShipments);

/**
 * @route   GET /api/shipments/carriers
 * @desc    Get carrier performance
 * @access  Private
 */
router.get('/carriers', getCarrierPerformance);

/**
 * @route   GET /api/shipments/:id
 * @desc    Get shipment detail with tracking
 * @access  Private
 */
router.get('/:id', getShipmentDetail);

export default router;
