import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getInventoryData,
  getOpenOrdersData,
  getSupplierData,
  getDemandData,
  getKPIData,
} from '../controllers/dashboard';
import {
  getDashboardData,
  getChartData,
  refreshDashboard,
} from '../controllers/dashboardEnhanced';

const router = Router();

/**
 * @route   GET /api/dashboard/data
 * @desc    Get full dashboard data
 * @access  Private (requires valid JWT)
 */
router.get('/data', authMiddleware, getDashboardData);

/**
 * @route   GET /api/dashboard/charts/:chartName
 * @desc    Get individual chart data
 * @access  Private (requires valid JWT)
 */
router.get('/charts/:chartName', authMiddleware, getChartData);

/**
 * @route   POST /api/dashboard/refresh
 * @desc    Refresh dashboard cache
 * @access  Private (requires valid JWT)
 */
router.post('/refresh', authMiddleware, refreshDashboard);

/**
 * @route   GET /api/dashboard/inventory
 * @desc    Get inventory dashboard data
 * @access  Private (requires valid JWT)
 */
router.get('/inventory', authMiddleware, getInventoryData);

/**
 * @route   GET /api/dashboard/orders
 * @desc    Get open orders dashboard data
 * @access  Private (requires valid JWT)
 */
router.get('/orders', authMiddleware, getOpenOrdersData);

/**
 * @route   GET /api/dashboard/suppliers
 * @desc    Get supplier performance dashboard data
 * @access  Private (requires valid JWT)
 */
router.get('/suppliers', authMiddleware, getSupplierData);

/**
 * @route   GET /api/dashboard/demand
 * @desc    Get demand forecast dashboard data
 * @access  Private (requires valid JWT)
 */
router.get('/demand', authMiddleware, getDemandData);

/**
 * @route   GET /api/dashboard/kpis
 * @desc    Get KPI dashboard data
 * @access  Private (requires valid JWT)
 */
router.get('/kpis', authMiddleware, getKPIData);

export default router;
