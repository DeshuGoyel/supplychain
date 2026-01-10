import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const billingController = new BillingController();

/**
 * GET /api/billing/plans
 * Get all available pricing plans
 */
router.get('/plans', billingController.getPlans.bind(billingController));

/**
 * GET /api/billing/subscription/:companyId
 * Get current subscription status for company
 */
router.get('/subscription/:companyId', authMiddleware, billingController.getSubscriptionStatus.bind(billingController));

/**
 * POST /api/billing/checkout/:companyId
 * Create Stripe checkout session for subscription
 */
router.post('/checkout/:companyId', authMiddleware, billingController.createCheckoutSession.bind(billingController));

/**
 * GET /api/billing/invoices/:companyId
 * Get invoices for company
 */
router.get('/invoices/:companyId', authMiddleware, billingController.getInvoices.bind(billingController));

/**
 * GET /api/billing/invoices/:companyId/:invoiceId
 * Get specific invoice with PDF
 */
router.get('/invoices/:companyId/:invoiceId', authMiddleware, billingController.getInvoice.bind(billingController));

/**
 * PUT /api/billing/billing-info/:companyId
 * Update billing information
 */
router.put('/billing-info/:companyId', authMiddleware, billingController.updateBillingInfo.bind(billingController));

/**
 * POST /api/billing/payment-intent/:companyId
 * Create payment intent for one-time payments
 */
router.post('/payment-intent/:companyId', authMiddleware, billingController.createPaymentIntent.bind(billingController));

/**
 * POST /api/billing/cancel/:companyId
 * Cancel subscription (MANAGER only)
 */
router.post('/cancel/:companyId', authMiddleware, billingController.cancelSubscription.bind(billingController));

/**
 * GET /api/billing/usage/:companyId
 * Get usage statistics for company
 */
router.get('/usage/:companyId', authMiddleware, billingController.getUsageStats.bind(billingController));

export default router;