import { Router } from 'express';
import { getDemandForecast, getHistoricalDemand, getForecastAccuracy, createScenario } from '../controllers/demandController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/demand/forecast
 * @desc    Get 12-month demand forecast
 * @access  Private
 */
router.get('/forecast', getDemandForecast);

/**
 * @route   GET /api/demand/historical
 * @desc    Get historical demand data
 * @access  Private
 */
router.get('/historical', getHistoricalDemand);

/**
 * @route   GET /api/demand/accuracy
 * @desc    Get forecast accuracy
 * @access  Private
 */
router.get('/accuracy', getForecastAccuracy);

/**
 * @route   POST /api/demand/scenarios
 * @desc    Create demand scenario
 * @access  Private
 */
router.post('/scenarios', createScenario);

export default router;
