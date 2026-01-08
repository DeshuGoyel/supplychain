import { Router } from 'express';
import {
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  getInvoices,
  getUsage,
  trackUsage,
  handleWebhook,
} from '../controllers/billingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/subscribe', authenticate, createSubscription);
router.get('/subscription', authenticate, getSubscription);
router.post('/upgrade', authenticate, updateSubscription);
router.post('/cancel', authenticate, cancelSubscription);
router.get('/invoices', authenticate, getInvoices);
router.get('/usage', authenticate, getUsage);
router.post('/usage/track', authenticate, trackUsage);
router.post('/webhook', handleWebhook);

export default router;
