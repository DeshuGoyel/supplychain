import { Router } from 'express';
import {
  upgradeSubscription,
  downgradeSubscription,
  cancelSubscription,
  getCustomerPortalLink,
  getSubscriptionDetails
} from '../controllers/subscriptionController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get detailed subscription info
router.get('/details', getSubscriptionDetails);

// Upgrade subscription (prorated)
router.post('/upgrade', requireRole(['MANAGER']), upgradeSubscription);

// Downgrade subscription (prorated, effective next billing cycle)
router.post('/downgrade', requireRole(['MANAGER']), downgradeSubscription);

// Cancel subscription
router.post('/cancel', requireRole(['MANAGER']), cancelSubscription);

// Get Stripe customer portal link
router.get('/portal', getCustomerPortalLink);

export default router;
