import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { stripe, PRICING_TIERS, getTierLimits, TRIAL_PERIOD_DAYS } from '../utils/stripe';
import { sendEmail, emailTemplates } from '../utils/email';

const prisma = new PrismaClient();

// Create a new subscription
export async function createSubscription(req: Request, res: Response) {
  try {
    const { tier, paymentMethodId } = req.body;
    const companyId = (req as any).user.companyId;

    // Validate tier
    if (!PRICING_TIERS[tier as keyof typeof PRICING_TIERS]) {
      return res.status(400).json({ error: 'Invalid pricing tier' });
    }

    // Get company and user details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { users: { take: 1 } },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = company.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: company.users[0]?.email,
        name: company.name,
        metadata: { companyId },
      });
      stripeCustomerId = customer.id;

      await prisma.company.update({
        where: { id: companyId },
        data: { stripeCustomerId },
      });
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const priceId = PRICING_TIERS[tier as keyof typeof PRICING_TIERS].priceId;
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: paymentMethodId ? 0 : TRIAL_PERIOD_DAYS,
      metadata: { companyId, tier },
    }) as any;

    // Update company
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: subscription.status === 'trialing' ? 'trial' : 'active',
        subscriptionTier: tier,
        stripeSubscriptionId: subscription.id,
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd,
        nextBillingDate: new Date(subscription.current_period_end * 1000),
      },
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        companyId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        tier,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    // Send confirmation email
    if (company.users[0]) {
      const template = paymentMethodId
        ? emailTemplates.subscriptionConfirmed(
            company.users[0].name,
            PRICING_TIERS[tier as keyof typeof PRICING_TIERS].name,
            PRICING_TIERS[tier as keyof typeof PRICING_TIERS].price
          )
        : emailTemplates.trialStarted(company.users[0].name, trialEnd!);

      await sendEmail({
        to: company.users[0].email,
        ...template,
      });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier,
        trialEnd,
      },
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
}

// Get current subscription
export async function getSubscription(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    // Calculate days until trial end
    let daysUntilTrialEnd = null;
    if (company.trialEnd) {
      const now = new Date();
      const diff = company.trialEnd.getTime() - now.getTime();
      daysUntilTrialEnd = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    res.json({
      subscription: {
        tier: company.subscriptionTier,
        status: company.subscriptionStatus,
        trialEnd: company.trialEnd,
        daysUntilTrialEnd,
        nextBillingDate: company.nextBillingDate,
        limits: getTierLimits(company.subscriptionTier || 'starter'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch subscription' });
  }
}

// Upgrade/downgrade subscription
export async function updateSubscription(req: Request, res: Response) {
  try {
    const { tier } = req.body;
    const companyId = (req as any).user.companyId;

    if (!PRICING_TIERS[tier as keyof typeof PRICING_TIERS]) {
      return res.status(400).json({ error: 'Invalid pricing tier' });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { users: { take: 1 } },
    });

    if (!company?.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      company.stripeSubscriptionId
    );
    const newPriceId = PRICING_TIERS[tier as keyof typeof PRICING_TIERS].priceId;

    const updatedSubscription = await stripe.subscriptions.update(
      company.stripeSubscriptionId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
        metadata: { tier },
      }
    );

    // Update database
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
      },
    });

    await prisma.subscription.update({
      where: { companyId },
      data: {
        tier,
        stripePriceId: newPriceId,
        status: updatedSubscription.status,
      },
    });

    // Send confirmation email
    if (company.users[0]) {
      await sendEmail({
        to: company.users[0].email,
        ...emailTemplates.subscriptionConfirmed(
          company.users[0].name,
          PRICING_TIERS[tier as keyof typeof PRICING_TIERS].name,
          PRICING_TIERS[tier as keyof typeof PRICING_TIERS].price
        ),
      });
    }

    res.json({ success: true, tier });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to update subscription' });
  }
}

// Cancel subscription
export async function cancelSubscription(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company?.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel at period end
    await stripe.subscriptions.update(company.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { companyId },
      data: { cancelAtPeriodEnd: true },
    });

    res.json({ success: true, message: 'Subscription will be cancelled at period end' });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
}

// Get invoices
export async function getInvoices(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;

    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch invoices' });
  }
}

// Get usage statistics
export async function getUsage(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get usage records for current period
    const usageRecords = await prisma.usageRecord.findMany({
      where: { companyId, period },
    });

    // Aggregate usage by metric
    const usage: Record<string, number> = {};
    usageRecords.forEach((record) => {
      usage[record.metric] = (usage[record.metric] || 0) + record.quantity;
    });

    // Get current user count
    const userCount = await prisma.user.count({
      where: { companyId },
    });

    usage.users = userCount;

    const limits = getTierLimits(company.subscriptionTier || 'starter');

    res.json({
      usage,
      limits,
      period,
    });
  } catch (error: any) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch usage' });
  }
}

// Track usage
export async function trackUsage(req: Request, res: Response) {
  try {
    const { metric, quantity } = req.body;
    const companyId = (req as any).user.companyId;
    const period = new Date().toISOString().slice(0, 7);

    await prisma.usageRecord.create({
      data: {
        companyId,
        metric,
        quantity: quantity || 1,
        period,
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking usage:', error);
    res.status(500).json({ error: error.message || 'Failed to track usage' });
  }
}

// Stripe webhook handler
export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as any;
        const companyId = subscription.metadata.companyId;

        await prisma.company.update({
          where: { id: companyId },
          data: {
            subscriptionStatus:
              subscription.status === 'trialing' ? 'trial' : subscription.status,
            nextBillingDate: new Date(subscription.current_period_end * 1000),
          },
        });

        await prisma.subscription.upsert({
          where: { companyId },
          update: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
          create: {
            companyId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            tier: subscription.metadata.tier,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const companyId = subscription.metadata.companyId;

        await prisma.company.update({
          where: { id: companyId },
          data: {
            subscriptionStatus: 'cancelled',
          },
        });

        await prisma.subscription.update({
          where: { companyId },
          data: { status: 'cancelled' },
        });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const companyId = (customer as any).metadata?.companyId;

        if (companyId) {
          await prisma.invoice.create({
            data: {
              companyId,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'paid',
              pdfUrl: invoice.invoice_pdf,
              invoiceNumber: invoice.number,
              paidAt: new Date(invoice.status_transitions.paid_at * 1000),
            },
          });

          // Send invoice email
          const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { users: { take: 1 } },
          });

          if (company?.users[0]) {
            await sendEmail({
              to: company.users[0].email,
              ...emailTemplates.invoiceReady(
                company.users[0].name,
                invoice.amount_paid / 100,
                invoice.invoice_pdf
              ),
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const companyId = (customer as any).metadata?.companyId;

        if (companyId) {
          const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { users: { take: 1 } },
          });

          if (company?.users[0]) {
            await sendEmail({
              to: company.users[0].email,
              ...emailTemplates.paymentFailed(
                company.users[0].name,
                invoice.amount_due / 100
              ),
            });
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}
