import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any
});

/**
 * Get detailed subscription information
 * GET /api/subscriptions/details
 */
export const getSubscriptionDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        whiteLabel: true
      }
    });

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found'
      });
      return;
    }

    // Get current plan
    const currentPlan = await prisma.plan.findFirst({
      where: { 
        tier: (company.subscriptionTier || 'starter') as string,
        isActive: true
      }
    });

    // Get upcoming invoice if exists
    let upcomingInvoice = null;
    if (company.stripeCustomerId && company.stripeSubscriptionId) {
      try {
        const invoices = await stripe.invoices.list({
          customer: company.stripeCustomerId,
          subscription: company.stripeSubscriptionId,
          limit: 1
        });
        if (invoices.data.length > 0) {
          const invoice = invoices.data[0];
          upcomingInvoice = {
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            dueDate: new Date(invoice.due_date ? invoice.due_date * 1000 : Date.now())
          };
        }
      } catch (e) {
        console.error('Error fetching upcoming invoice:', e);
      }
    }

    // Calculate days remaining in trial or billing cycle
    const now = new Date();
    const nextBillingDate = company.nextBillingDate || company.trialEnd;
    const daysRemaining = nextBillingDate
      ? Math.max(0, Math.ceil((new Date(nextBillingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    res.status(200).json({
      success: true,
      subscription: {
        status: company.subscriptionStatus,
        tier: company.subscriptionTier,
        trialStart: company.trialStart,
        trialEnd: company.trialEnd,
        nextBillingDate: company.nextBillingDate,
        daysRemaining,
        plan: currentPlan,
        stripeCustomerId: company.stripeCustomerId,
        stripeSubscriptionId: company.stripeSubscriptionId,
        upcomingInvoice
      }
    });
  } catch (error) {
    console.error('Get subscription details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching subscription details'
    });
  }
};

/**
 * Upgrade subscription with proration
 * POST /api/subscriptions/upgrade
 */
export const upgradeSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const { newPriceId } = req.body;

    if (!newPriceId) {
      res.status(400).json({
        success: false,
        message: 'newPriceId is required'
      });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company || !company.stripeSubscriptionId || !company.stripeCustomerId) {
      res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
      return;
    }

    // Get new plan details
    const newPlan = await prisma.plan.findFirst({
      where: { stripePriceId: newPriceId, isActive: true }
    });

    if (!newPlan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
      return;
    }

    // Get Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      company.stripeSubscriptionId
    );

    // Calculate proration amount
    const subscriptionItem = stripeSubscription.items.data[0];
    if (!subscriptionItem) {
      res.status(500).json({
        success: false,
        message: 'No subscription items found'
      });
      return;
    }
    
    const subscriptionItemId = subscriptionItem.id;
    const prorationDate = Math.floor(Date.now() / 1000);

    // Create a preview invoice to show proration
    const previewInvoice = await (stripe.invoices as any).retrieveUpcoming({
      customer: company.stripeCustomerId,
      subscription: company.stripeSubscriptionId,
      subscription_items: [
        {
          id: subscriptionItemId,
          price: newPriceId
        }
      ],
      proration_date: prorationDate
    });

    const prorationAmount = previewInvoice.amount_due / 100;

    // Update subscription immediately
    const updatedSubscription = await stripe.subscriptions.update(
      company.stripeSubscriptionId,
      {
        items: [
          {
            id: subscriptionItemId,
            price: newPriceId
          }
        ],
        proration_behavior: 'always_invoice'
      } as any
    );

    // Update company in database
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionTier: newPlan.tier
      }
    });

    // Log the upgrade
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.userId,
        companyId,
        action: 'SUBSCRIPTION_UPGRADE',
        success: true,
        previousTier: company.subscriptionTier,
        newTier: newPlan.tier,
        prorationAmount,
        newPriceId,
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined
      } as any
    });

    res.status(200).json({
      success: true,
      message: `Upgraded to ${newPlan.name} successfully`,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        tier: newPlan.tier,
        prorationAmount,
        newMonthlyPrice: newPlan.monthlyPrice
      }
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error upgrading subscription'
    });
  }
};

/**
 * Downgrade subscription (effective next billing cycle)
 * POST /api/subscriptions/downgrade
 */
export const downgradeSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const { newPriceId } = req.body;

    if (!newPriceId) {
      res.status(400).json({
        success: false,
        message: 'newPriceId is required'
      });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company || !company.stripeSubscriptionId || !company.stripeCustomerId) {
      res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
      return;
    }

    // Get new plan details
    const newPlan = await prisma.plan.findFirst({
      where: { stripePriceId: newPriceId, isActive: true }
    });

    if (!newPlan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
      return;
    }

    // Get Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      company.stripeSubscriptionId
    );

    const subscriptionItem = stripeSubscription.items.data[0];
    if (!subscriptionItem) {
      res.status(500).json({
        success: false,
        message: 'No subscription items found'
      });
      return;
    }

    const subscriptionItemId = subscriptionItem.id;

    // Update subscription at period end (no immediate charge)
    const updatedSubscription = await stripe.subscriptions.update(
      company.stripeSubscriptionId,
      {
        items: [
          {
            id: subscriptionItemId,
            price: newPriceId
          }
        ],
        proration_behavior: 'create_prorations'
      } as any
    );

    // Update company in database
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionTier: newPlan.tier
      }
    });

    // Log the downgrade
    const subData = updatedSubscription as any;
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.userId,
        companyId,
        action: 'SUBSCRIPTION_DOWNGRADE',
        success: true,
        previousTier: company.subscriptionTier,
        newTier: newPlan.tier,
        effectiveAt: new Date(subData.current_period_end * 1000),
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined
      } as any
    });

    res.status(200).json({
      success: true,
      message: `Downgrade to ${newPlan.name} scheduled for next billing cycle`,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        tier: newPlan.tier,
        currentPeriodEnd: new Date(subData.current_period_end * 1000),
        newMonthlyPrice: newPlan.monthlyPrice
      }
    });
  } catch (error) {
    console.error('Downgrade subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error downgrading subscription'
    });
  }
};

/**
 * Cancel subscription
 * POST /api/subscriptions/cancel
 */
export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const { cancelAtPeriodEnd, reason } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company || !company.stripeSubscriptionId) {
      res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
      return;
    }

    let subscription;
    if (cancelAtPeriodEnd) {
      // Cancel at end of billing period
      subscription = await stripe.subscriptions.update(
        company.stripeSubscriptionId,
        {
          cancel_at_period_end: true
        } as any
      );

      await prisma.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: 'cancelling'
        }
      });
    } else {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(
        company.stripeSubscriptionId
      );

      await prisma.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: 'cancelled',
          subscriptionTier: null
        }
      });
    }

    // Log the cancellation
    const cancelData = subscription as any;
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.userId,
        companyId,
        action: 'SUBSCRIPTION_CANCEL',
        success: true,
        cancelAtPeriodEnd,
        reason,
        subscriptionStatus: subscription.status,
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined
      } as any
    });

    res.status(200).json({
      success: true,
      message: cancelAtPeriodEnd
        ? 'Subscription will be cancelled at end of billing period'
        : 'Subscription cancelled immediately',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: cancelData.current_period_end
          ? new Date(cancelData.current_period_end * 1000)
          : null
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error cancelling subscription'
    });
  }
};

/**
 * Get Stripe customer portal link
 * GET /api/subscriptions/portal
 */
export const getCustomerPortalLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company || !company.stripeCustomerId) {
      res.status(400).json({
        success: false,
        message: 'No Stripe customer found'
      });
      return;
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`
    });

    res.status(200).json({
      success: true,
      url: portalSession.url
    });
  } catch (error) {
    console.error('Get customer portal link error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error creating portal session'
    });
  }
};
