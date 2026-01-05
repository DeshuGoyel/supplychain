import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getShipments,
  getShipmentById,
  createShipment,
  updateShipmentStatus,
  getDelayedShipments,
  getCarrierPerformance
} from '../controllers/shipmentController';

const router = Router();

router.get('/', authMiddleware, getShipments);
router.get('/exceptions', authMiddleware, getDelayedShipments);
router.get('/carriers', authMiddleware, getCarrierPerformance);
router.get('/:id', authMiddleware, getShipmentById);
router.post('/', authMiddleware, createShipment);
router.patch('/:id/status', authMiddleware, updateShipmentStatus);

export default router;
