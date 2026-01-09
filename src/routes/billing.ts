import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  subscribe,
  getSubscription,
  upgradeSubscription,
  cancelSubscriptionHandler,
  getInvoices,
  getUsage,
  trackUsage,
  stripeWebhook
} from '../controllers/billingController';

const router = express.Router();

// Stripe webhook (no auth, verified by signature)
router.post('/webhook', stripeWebhook);

// Authenticated routes
router.post('/subscribe', authMiddleware, subscribe);
router.get('/subscription', authMiddleware, getSubscription);
router.post('/upgrade', authMiddleware, upgradeSubscription);
router.post('/downgrade', authMiddleware, upgradeSubscription);
router.post('/cancel', authMiddleware, cancelSubscriptionHandler);
router.get('/invoices', authMiddleware, getInvoices);
router.get('/usage', authMiddleware, getUsage);
router.post('/usage/track', authMiddleware, trackUsage);

export default router;
