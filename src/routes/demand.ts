import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getForecast,
  getHistorical,
  getAccuracy,
  createScenario
} from '../controllers/demandController';

const router = Router();

router.get('/forecast', authMiddleware, getForecast);
router.get('/historical', authMiddleware, getHistorical);
router.get('/accuracy', authMiddleware, getAccuracy);
router.post('/scenarios', authMiddleware, createScenario);

export default router;
