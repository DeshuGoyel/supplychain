import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getInventoryData,
  getOpenOrdersData,
  getSupplierData,
  getDemandData,
  getKPIData,
} from '../controllers/dashboard';

const router = Router();

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
