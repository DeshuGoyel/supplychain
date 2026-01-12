import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import stripe from '../utils/stripe';

const prisma = new PrismaClient();

export const getPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true }
    });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching plans' });
  }
};

export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEnd: true,
        nextBillingDate: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true
      }
    });

    res.status(200).json({ success: true, subscription: company });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching subscription status' });
  }
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const { priceId } = req.body;

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found' });
      return;
    }

    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.billingEmail || undefined,
        name: company.name,
        metadata: { companyId: company.id }
      });
      customerId = customer.id;
      await prisma.company.update({
        where: { id: companyId },
        data: { stripeCustomerId: customerId }
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/billing?canceled=true`,
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ success: false, message: 'Internal server error creating checkout session' });
  }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      orderBy: { issuedAt: 'desc' }
    });
    res.status(200).json({ success: true, invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching invoices' });
  }
};

export const updateBillingInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const { billingEmail, billingAddress, taxId } = req.body;

    await prisma.company.update({
      where: { id: companyId },
      data: { billingEmail, billingAddress, taxId }
    });

    res.status(200).json({ success: true, message: 'Billing information updated' });
  } catch (error) {
    console.error('Update billing info error:', error);
    res.status(500).json({ success: false, message: 'Internal server error updating billing info' });
  }
};

export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const company = await prisma.company.findUnique({ where: { id: companyId } });

    if (!company || !company.stripeSubscriptionId) {
      res.status(400).json({ success: false, message: 'No active subscription found' });
      return;
    }

    await stripe.subscriptions.cancel(company.stripeSubscriptionId);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: 'cancelled'
      }
    });

    res.status(200).json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Internal server error cancelling subscription' });
  }
};

export const createBillingPortalLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId as string;
    const company = await prisma.company.findUnique({ where: { id: companyId } });

    if (!company || !company.stripeCustomerId) {
      res.status(400).json({ success: false, message: 'Stripe customer not found for this company' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard/billing`,
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error('Create billing portal link error:', error);
    res.status(500).json({ success: false, message: 'Internal server error creating portal link' });
  }
};

export const getUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId as string;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionStatus: true,
        subscriptionTier: true,
        nextBillingDate: true,
        stripeCustomerId: true,
      },
    });

    const plan = company?.subscriptionTier
      ? await prisma.plan.findFirst({ where: { tier: company.subscriptionTier, isActive: true } })
      : null;

    const usersUsed = await prisma.user.count({ where: { companyId } });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const apiCallsAgg = await prisma.usageMetric.aggregate({
      where: { companyId, metric: 'api_calls', timestamp: { gte: monthStart } },
      _sum: { value: true },
    });

    const storageAgg = await prisma.usageMetric.aggregate({
      where: { companyId, metric: 'storage_gb', timestamp: { gte: monthStart } },
      _sum: { value: true },
    });

    res.status(200).json({
      success: true,
      usage: {
        usersUsed,
        apiCallsUsed: apiCallsAgg._sum.value || 0,
        storageUsedGb: storageAgg._sum.value || 0,
        subscriptionStatus: company?.subscriptionStatus || 'trial',
        nextBillingDate: company?.nextBillingDate,
        apiCallsTrend: 0,
        activeUsers: usersUsed,
      },
      plan,
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching usage' });
  }
};
