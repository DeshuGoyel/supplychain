import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as forecastController from '../controllers/forecastController';

const router = express.Router();

router.use(authenticateToken);

router.get('/sku/:sku', forecastController.getForecast);
router.get('/bulk', forecastController.getBulkForecasts);
router.get('/reorder-suggestions', forecastController.getReorderSuggestions);
router.post('/reorder-suggestions/:id/approve', forecastController.approveReorderSuggestion);
router.get('/aging-analysis', forecastController.getAgingAnalysis);
router.get('/abc-xyz', forecastController.getABCXYZAnalysis);
router.get('/accuracy', forecastController.getForecastAccuracy);

export default router;
