import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const webhookController = new WebhookController();

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhooks
 */
router.post('/stripe', webhookController.handleStripeWebhook.bind(webhookController));

// Add more webhook endpoints as needed
// router.post('/webhooks/other-service', webhookController.handleOtherWebhook.bind(webhookController));

export default router;