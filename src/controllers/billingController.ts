import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  stripe,
  PRICING_TIERS,
  getStripePriceId,
  createStripeCustomer,
  createTrialSubscription,
  updateSubscription,
  cancelSubscription,
  getCustomerInvoices
} from '../utils/stripe';
import { sendEmail, emailTemplates } from '../utils/email';

const prisma = new PrismaClient();

/**
 * Create a new subscription
 * POST /api/billing/subscribe
 */
export const subscribe = async (req: any, res: Response): Promise<void> => {
  try {
    const { tier = 'starter', billingCycle = 'monthly', paymentMethodId } = req.body;
    const companyId = req.user.companyId;
    const userId = req.user.userId;

    // Validate tier
    if (!['starter', 'growth', 'enterprise'].includes(tier)) {
      res.status(400).json({
        success: false,
        message: 'Invalid tier. Must be starter, growth, or enterprise'
      });
      return;
    }

    // Get company and user
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!company || !user) {
      res.status(404).json({
        success: false,
        message: 'Company or user not found'
      });
      return;
    }

    // Create Stripe customer if not exists
    let stripeCustomerId = company.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createStripeCustomer(
        user.email,
        company.name,
        company.id
      );
      stripeCustomerId = customer.id;
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    // Get price ID
    const priceId = getStripePriceId(tier, billingCycle);
    if (!priceId) {
      res.status(500).json({
        success: false,
        message: 'Stripe price ID not configured for this tier'
      });
      return;
    }

    // Create subscription
    const subscription = await createTrialSubscription(stripeCustomerId, priceId);

    // Calculate trial end date
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Update company
    await prisma.company.update({
      where: { id: companyId },
      data: {
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'trialing',
        subscriptionTier: tier,
        trialStart: new Date(),
        trialEnd,
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      }
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        companyId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        tier,
        status: subscription.status,
        billingCycle,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    // Create referral program if not exists
    const existingReferral = await prisma.referralProgram.findUnique({
      where: { companyId }
    });

    if (!existingReferral) {
      const referralCode = `${company.name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(7)}`;
      await prisma.referralProgram.create({
        data: {
          companyId,
          referralCode
        }
      });
    }

    // Send welcome email
    await sendEmail({
      to: user.email,
      ...emailTemplates.trialStarted(user.name, trialEnd.toLocaleDateString())
    });

    res.status(200).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        tier,
        status: subscription.status,
        trialEnd,
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error: any) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
};

/**
 * Get current subscription
 * GET /api/billing/subscription
 */
export const getSubscription = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId = req.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found'
      });
      return;
    }

    const subscription = company.subscriptions[0];

    res.status(200).json({
      success: true,
      subscription: {
        tier: company.subscriptionTier,
        status: company.subscriptionStatus,
        trialStart: company.trialStart,
        trialEnd: company.trialEnd,
        nextBillingDate: company.nextBillingDate,
        billingCycle: subscription?.billingCycle || 'monthly',
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false
      }
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription',
      error: error.message
    });
  }
};

/**
 * Upgrade or downgrade subscription
 * POST /api/billing/upgrade
 */
export const upgradeSubscription = async (req: any, res: Response): Promise<void> => {
  try {
    const { tier, billingCycle = 'monthly' } = req.body;
    const companyId = req.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company || !company.stripeSubscriptionId) {
      res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
      return;
    }

    // Get new price ID
    const newPriceId = getStripePriceId(tier, billingCycle);
    if (!newPriceId) {
      res.status(400).json({
        success: false,
        message: 'Invalid tier or billing cycle'
      });
      return;
    }

    // Update Stripe subscription
    const updatedSubscription = await updateSubscription(
      company.stripeSubscriptionId,
      newPriceId
    );

    // Update database
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: updatedSubscription.status,
        nextBillingDate: new Date(updatedSubscription.current_period_end * 1000)
      }
    });

    await prisma.subscription.updateMany({
      where: {
        companyId,
        stripeSubscriptionId: company.stripeSubscriptionId
      },
      data: {
        tier,
        stripePriceId: newPriceId,
        status: updatedSubscription.status,
        billingCycle,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
      }
    });

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: {
        tier,
        status: updatedSubscription.status,
        nextBillingDate: new Date(updatedSubscription.current_period_end * 1000)
      }
    });
  } catch (error: any) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade subscription',
      error: error.message
    });
  }
};

/**
 * Cancel subscription
 * POST /api/billing/cancel
 */
export const cancelSubscriptionHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const { immediately = false } = req.body;
    const companyId = req.user.companyId;
    const userId = req.user.userId;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!company || !company.stripeSubscriptionId || !user) {
      res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
      return;
    }

    // Cancel Stripe subscription
    const cancelledSubscription = await cancelSubscription(
      company.stripeSubscriptionId,
      immediately
    );

    // Update database
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: immediately ? 'cancelled' : 'active'
      }
    });

    await prisma.subscription.updateMany({
      where: {
        companyId,
        stripeSubscriptionId: company.stripeSubscriptionId
      },
      data: {
        status: cancelledSubscription.status,
        cancelAtPeriodEnd: !immediately
      }
    });

    // Send cancellation email
    const endDate = new Date(cancelledSubscription.current_period_end * 1000).toLocaleDateString();
    await sendEmail({
      to: user.email,
      ...emailTemplates.cancellationConfirmation(user.name, endDate)
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      endsAt: new Date(cancelledSubscription.current_period_end * 1000)
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
};

/**
 * Get invoices
 * GET /api/billing/invoices
 */
export const getInvoices = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId = req.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company || !company.stripeCustomerId) {
      res.status(200).json({
        success: true,
        invoices: []
      });
      return;
    }

    // Get invoices from Stripe
    const stripeInvoices = await getCustomerInvoices(company.stripeCustomerId);

    // Store in database if not exists
    for (const invoice of stripeInvoices) {
      const existingInvoice = await prisma.invoice.findUnique({
        where: { stripeInvoiceId: invoice.id }
      });

      if (!existingInvoice) {
        await prisma.invoice.create({
          data: {
            companyId,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: invoice.status || 'paid',
            pdfUrl: invoice.invoice_pdf || null,
            invoiceNumber: invoice.number || null,
            billingPeriod: new Date(invoice.period_start * 1000).toLocaleDateString()
          }
        });
      }
    }

    // Get from database
    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      invoices
    });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices',
      error: error.message
    });
  }
};

/**
 * Get usage
 * GET /api/billing/usage
 */
export const getUsage = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId = req.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found'
      });
      return;
    }

    const tier = company.subscriptionTier || 'starter';
    const limits = PRICING_TIERS[tier as keyof typeof PRICING_TIERS].limits;

    // Get usage from current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        companyId,
        timestamp: { gte: startOfMonth }
      }
    });

    // Aggregate usage by metric
    const usage: Record<string, number> = {
      apiCalls: 0,
      storage: 0,
      users: 0,
      reports: 0
    };

    usageRecords.forEach(record => {
      const key = record.metric;
      if (usage[key] !== undefined) {
        usage[key] = (usage[key] || 0) + record.quantity;
      }
    });

    // Get current users count
    const usersCount = await prisma.user.count({
      where: { companyId }
    });
    usage.users = usersCount;

    res.status(200).json({
      success: true,
      usage,
      limits,
      tier,
      percentages: {
        apiCalls: limits.apiCalls === -1 ? 0 : ((usage.apiCalls || 0) / limits.apiCalls) * 100,
        storage: limits.storage === -1 ? 0 : ((usage.storage || 0) / limits.storage) * 100,
        users: limits.users === -1 ? 0 : ((usage.users || 0) / limits.users) * 100,
        reports: limits.reports === -1 ? 0 : ((usage.reports || 0) / limits.reports) * 100
      }
    });
  } catch (error: any) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage',
      error: error.message
    });
  }
};

/**
 * Track usage
 * POST /api/billing/usage/track
 */
export const trackUsage = async (req: any, res: Response): Promise<void> => {
  try {
    const { metric, quantity = 1 } = req.body;
    const companyId = req.user.companyId;

    if (!['apiCalls', 'storage', 'users', 'reports', 'exports'].includes(metric)) {
      res.status(400).json({
        success: false,
        message: 'Invalid metric'
      });
      return;
    }

    await prisma.usageRecord.create({
      data: {
        companyId,
        metric,
        quantity
      }
    });

    res.status(200).json({
      success: true,
      message: 'Usage tracked successfully'
    });
  } catch (error: any) {
    console.error('Track usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track usage',
      error: error.message
    });
  }
};

/**
 * Stripe webhook handler
 * POST /api/billing/webhook
 */
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      res.status(400).send('Webhook signature missing');
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle events
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

// Helper functions for webhook handlers
const handleSubscriptionUpdate = async (subscription: any) => {
  const company = await prisma.company.findUnique({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (company) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionStatus: subscription.status,
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      }
    });

    await prisma.subscription.updateMany({
      where: {
        companyId: company.id,
        stripeSubscriptionId: subscription.id
      },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }
};

const handleSubscriptionDeleted = async (subscription: any) => {
  const company = await prisma.company.findUnique({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (company) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionStatus: 'cancelled'
      }
    });
  }
};

const handleInvoicePaymentSucceeded = async (invoice: any) => {
  const company = await prisma.company.findUnique({
    where: { stripeCustomerId: invoice.customer }
  });

  if (company) {
    await prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        status: 'paid',
        pdfUrl: invoice.invoice_pdf
      },
      create: {
        companyId: company.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'paid',
        pdfUrl: invoice.invoice_pdf,
        invoiceNumber: invoice.number
      }
    });
  }
};

const handleInvoicePaymentFailed = async (invoice: any) => {
  const company = await prisma.company.findUnique({
    where: { stripeCustomerId: invoice.customer }
  });

  if (company) {
    const user = await prisma.user.findFirst({
      where: { companyId: company.id, role: 'MANAGER' }
    });

    if (user) {
      await sendEmail({
        to: user.email,
        ...emailTemplates.paymentFailed(user.name)
      });
    }
  }
};
