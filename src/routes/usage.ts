import { Router } from 'express';
import {
  reportUsage,
  getUsageSummary,
  getUsageLimits,
  updateUsageLimits,
  resetUsage,
  getUsageHistory
} from '../controllers/usageController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get usage limits and current usage
router.get('/limits', getUsageLimits);

// Get usage summary for current billing period
router.get('/summary', getUsageSummary);

// Get usage history
router.get('/history', requireRole(['MANAGER']), getUsageHistory);

// Report usage (called by internal services)
router.post('/report', requireRole(['MANAGER']), reportUsage);

// Update usage limits (MANAGER only)
router.put('/limits', requireRole(['MANAGER']), updateUsageLimits);

// Reset usage counters (MANAGER only)
router.post('/reset', requireRole(['MANAGER']), resetUsage);

export default router;
