import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  stripe, 
  PLANS, 
  createCustomer, 
  createSubscription, 
  createCheckoutSession,
  getCustomer,
  getSubscription,
  cancelSubscription,
  updateSubscription,
  getInvoices,
  getInvoice,
  createPaymentIntent
} from '../utils/stripe';

const prisma = new PrismaClient();

export class BillingController {
  /**
   * Get all available pricing plans
   */
  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { monthlyPrice: 'asc' }
      });

      // If no plans in database, use default plans
      if (plans.length === 0) {
        const defaultPlans = [
          {
            id: 'default_starter',
            stripePriceId: 'price_starter',
            name: 'Starter',
            tier: 'starter',
            monthlyPrice: 29,
            yearlyPrice: 290,
            features: JSON.stringify([
              'Up to 5 users',
              '10,000 API calls/month',
              '10GB storage',
              'Basic inventory tracking',
              'Email support'
            ]),
            maxUsers: 5,
            maxApiCalls: 10000,
            maxStorageGb: 10,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'default_growth',
            stripePriceId: 'price_growth',
            name: 'Growth',
            tier: 'growth',
            monthlyPrice: 99,
            yearlyPrice: 990,
            features: JSON.stringify([
              'Up to 25 users',
              '100,000 API calls/month',
              '100GB storage',
              'Advanced analytics',
              'Priority support',
              'Custom integrations'
            ]),
            maxUsers: 25,
            maxApiCalls: 100000,
            maxStorageGb: 100,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'default_enterprise',
            stripePriceId: 'price_enterprise',
            name: 'Enterprise',
            tier: 'enterprise',
            monthlyPrice: 299,
            yearlyPrice: 2990,
            features: JSON.stringify([
              'Unlimited users',
              'Unlimited API calls',
              'Unlimited storage',
              'White-labeling',
              '24/7 dedicated support',
              'Custom features',
              'SLA guarantee'
            ]),
            maxUsers: -1, // Unlimited
            maxApiCalls: -1,
            maxStorageGb: -1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        res.json({
          success: true,
          data: defaultPlans
        });
        return;
      }

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get current subscription status for company
   */
  async getSubscriptionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
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

      let subscriptionDetails = null;

      if (company.stripeSubscriptionId) {
        try {
          const subscription = await getSubscription(company.stripeSubscriptionId);
          subscriptionDetails = {
            id: subscription.id,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialStart: subscription.trial_start,
            trialEnd: subscription.trial_end
          };
        } catch (error) {
          console.error('Error fetching Stripe subscription:', error);
        }
      }

      // Calculate trial status
      let trialStatus = null;
      if (company.trialStart && company.trialEnd) {
        const now = new Date();
        const trialEnd = new Date(company.trialEnd);
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        trialStatus = {
          active: now < trialEnd,
          daysRemaining: Math.max(0, daysRemaining),
          expired: daysRemaining <= 0
        };
      }

      res.json({
        success: true,
        data: {
          status: company.subscriptionStatus,
          tier: company.subscriptionTier,
          nextBillingDate: company.nextBillingDate,
          stripeCustomerId: company.stripeCustomerId,
          stripeSubscriptionId: company.stripeSubscriptionId,
          trialStart: company.trialStart,
          trialEnd: company.trialEnd,
          trialStatus,
          subscription: subscriptionDetails
        }
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Create Stripe checkout session for subscription
   */
  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { priceId, billingCycle = 'monthly' } = req.body;

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

      // Create or get Stripe customer
      let stripeCustomerId = company.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await createCustomer({
          email: req.body.email || 'unknown@example.com',
          name: company.name,
          companyName: company.name,
          billingAddress: company.billingAddress,
          taxId: company.taxId
        });

        stripeCustomerId = customer.id;

        // Update company with Stripe customer ID
        await prisma.company.update({
          where: { id: companyId },
          data: { stripeCustomerId }
        });
      }

      // Create checkout session
      const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing?success=true`;
      const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?canceled=true`;

      const session = await createCheckoutSession(
        priceId,
        stripeCustomerId,
        successUrl,
        cancelUrl
      );

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url
        }
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get invoices for company
   */
  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });

      if (!company || !company.stripeCustomerId) {
        res.status(404).json({
          success: false,
          message: 'Company or Stripe customer not found'
        });
        return;
      }

      // Get invoices from Stripe
      const stripeInvoices = await getInvoices(company.stripeCustomerId, parseInt(limit as string));

      // Get invoices from local database
      const localInvoices = await prisma.invoice.findMany({
        where: { companyId },
        orderBy: { issuedAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: {
          stripeInvoices,
          localInvoices
        }
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get specific invoice with PDF
   */
  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { invoiceId } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice) {
        res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
        return;
      }

      // Get invoice from Stripe
      const stripeInvoice = await getInvoice(invoice.stripeInvoiceId);

      res.json({
        success: true,
        data: {
          invoice,
          stripeInvoice
        }
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update billing information
   */
  async updateBillingInfo(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { billingEmail, billingAddress, taxId } = req.body;

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

      // Update company billing info
      await prisma.company.update({
        where: { id: companyId },
        data: {
          billingEmail,
          billingAddress,
          taxId
        }
      });

      // Update Stripe customer if available
      if (company.stripeCustomerId) {
        try {
          const customer = await getCustomer(company.stripeCustomerId);
          // In production, you would update the Stripe customer here
          console.log('Would update Stripe customer:', customer.id);
        } catch (error) {
          console.error('Error updating Stripe customer:', error);
        }
      }

      res.json({
        success: true,
        message: 'Billing information updated successfully'
      });
    } catch (error) {
      console.error('Error updating billing info:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Create payment intent for one-time payments
   */
  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { amount, currency = 'usd' } = req.body;

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

      const paymentIntent = await createPaymentIntent(
        amount,
        currency,
        company.stripeCustomerId
      );

      // Store payment in database
      await prisma.payment.create({
        data: {
          companyId,
          stripePaymentIntentId: paymentIntent.id,
          amount,
          currency,
          status: 'pending',
          paymentMethod: 'card',
          description: 'One-time payment'
        }
      });

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Cancel subscription (MANAGER only)
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

      // Check if user has permission (MANAGER role)
      const userRole = (req as any).user.role;
      if (userRole !== 'MANAGER') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });

      if (!company || !company.stripeSubscriptionId) {
        res.status(404).json({
          success: false,
          message: 'Company or subscription not found'
        });
        return;
      }

      // Cancel subscription at period end
      const subscription = await cancelSubscription(company.stripeSubscriptionId);

      // Update company subscription status
      await prisma.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: 'cancelled'
        }
      });

      // Log the cancellation
      await this.logAuditEvent(
        (req as any).user.id,
        companyId,
        'SUBSCRIPTION_CANCELLED',
        req,
        true,
        JSON.stringify({ subscriptionId: subscription.id })
      );

      res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get usage statistics for company
   */
  async getUsageStats(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

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

      // Get current plan limits
      const plan = await prisma.plan.findFirst({
        where: { 
          tier: company.subscriptionTier,
          isActive: true
        }
      });

      // Calculate current usage (these would be real metrics in production)
      const currentUsage = {
        users: await prisma.user.count({ where: { companyId } }),
        apiCalls: Math.floor(Math.random() * 10000), // Mock API calls
        storageUsed: Math.floor(Math.random() * 5), // Mock storage in GB
      };

      const limits = {
        users: plan?.maxUsers || 5,
        apiCalls: plan?.maxApiCalls || 10000,
        storageGb: plan?.maxStorageGb || 10
      };

      res.json({
        success: true,
        data: {
          currentUsage,
          limits,
          usagePercentages: {
            users: limits.users === -1 ? 0 : (currentUsage.users / limits.users) * 100,
            apiCalls: limits.apiCalls === -1 ? 0 : (currentUsage.apiCalls / limits.apiCalls) * 100,
            storageGb: limits.storageGb === -1 ? 0 : (currentUsage.storageUsed / limits.storageGb) * 100,
          }
        }
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Log audit events
   */
  private async logAuditEvent(
    userId: string,
    companyId: string,
    action: string,
    req: Request,
    success: boolean,
    details?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          companyId,
          action,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown',
          success,
          details: details || null
        }
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }
}