import { Router } from 'express';
import { getKPIs, getOTIFTrend, getInventoryTurns, generateReport, generateWeeklySummary } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/analytics/kpis
 * @desc    Get KPIs by period
 * @access  Private
 */
router.get('/kpis', getKPIs);

/**
 * @route   GET /api/analytics/otif
 * @desc    Get OTIF trend data
 * @access  Private
 */
router.get('/otif', getOTIFTrend);

/**
 * @route   GET /api/analytics/turns
 * @desc    Get inventory turns data
 * @access  Private
 */
router.get('/turns', getInventoryTurns);

/**
 * @route   POST /api/analytics/reports
 * @desc    Generate custom report
 * @access  Private
 */
router.post('/reports', generateReport);

/**
 * @route   POST /api/analytics/summary
 * @desc    Generate AI-powered weekly summary
 * @access  Private
 */
router.post('/summary', generateWeeklySummary);

export default router;
