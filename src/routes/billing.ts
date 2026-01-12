import { Router } from 'express';
import {
  getPlans,
  getSubscriptionStatus,
  createCheckoutSession,
  getInvoices,
  updateBillingInfo,
  cancelSubscription,
  createBillingPortalLink,
  getUsage,
} from '../controllers/billingController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/plans', getPlans);
router.get('/subscription', authMiddleware, getSubscriptionStatus);
router.get('/usage', authMiddleware, getUsage);
router.post('/checkout', authMiddleware, createCheckoutSession);
router.post('/portal-link', authMiddleware, createBillingPortalLink);
router.get('/invoices', authMiddleware, getInvoices);
router.put('/billing-info', authMiddleware, updateBillingInfo);
router.post('/cancel', authMiddleware, requireRole(['MANAGER']), cancelSubscription);

export default router;
