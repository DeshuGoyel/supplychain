import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { constructWebhookEvent, handleWebhookEvent } from '../utils/stripe';

const prisma = new PrismaClient();

export class WebhookController {
  /**
   * Handle Stripe webhooks
   */
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        res.status(400).json({
          success: false,
          message: 'Missing Stripe signature'
        });
        return;
      }

      const event = constructWebhookEvent(req.body, signature);

      console.log(`Received Stripe webhook: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event);
          break;
        
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event);
          break;
        
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Log webhook received
      await this.logWebhookEvent(event.type, 'stripe', true);

      res.json({ received: true });
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      
      // Log failed webhook
      await this.logWebhookEvent(req.headers['stripe-event-type'] as string || 'unknown', 'stripe', false);

      res.status(400).json({
        success: false,
        message: 'Webhook error'
      });
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(event: any): Promise<void> {
    try {
      const session = event.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      // Find company by Stripe customer ID
      const company = await prisma.company.findFirst({
        where: { stripeCustomerId: customerId }
      });

      if (company) {
        // Update company with subscription ID
        await prisma.company.update({
          where: { id: company.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active'
          }
        });

        console.log(`Subscription activated for company ${company.id}`);
      }
    } catch (error) {
      console.error('Error handling checkout completed:', error);
    }
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(event: any): Promise<void> {
    try {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find company by Stripe customer ID
      const company = await prisma.company.findFirst({
        where: { stripeCustomerId: customerId }
      });

      if (company) {
        // Update company subscription info
        await prisma.company.update({
          where: { id: company.id },
          data: {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            nextBillingDate: new Date(subscription.current_period_end * 1000)
          }
        });

        console.log(`Subscription created for company ${company.id}`);
      }
    } catch (error) {
      console.error('Error handling subscription created:', error);
    }
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(event: any): Promise<void> {
    try {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find company by Stripe customer ID
      const company = await prisma.company.findFirst({
        where: { stripeCustomerId: customerId }
      });

      if (company) {
        // Determine subscription tier based on price ID
        let tier = 'starter';
        if (subscription.items.data[0].price.id.includes('growth')) {
          tier = 'growth';
        } else if (subscription.items.data[0].price.id.includes('enterprise')) {
          tier = 'enterprise';
        }

        // Update company subscription info
        await prisma.company.update({
          where: { id: company.id },
          data: {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionTier: tier,
            nextBillingDate: new Date(subscription.current_period_end * 1000)
          }
        });

        console.log(`Subscription updated for company ${company.id}: ${tier}`);
      }
    } catch (error) {
      console.error('Error handling subscription updated:', error);
    }
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(event: any): Promise<void> {
    try {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find company by Stripe customer ID
      const company = await prisma.company.findFirst({
        where: { stripeCustomerId: customerId }
      });

      if (company) {
        // Update company subscription status
        await prisma.company.update({
          where: { id: company.id },
          data: {
            stripeSubscriptionId: null,
            subscriptionStatus: 'cancelled'
          }
        });

        console.log(`Subscription cancelled for company ${company.id}`);
      }
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
    }
  }

  /**
   * Handle invoice payment succeeded
   */
  private async handleInvoicePaymentSucceeded(event: any): Promise<void> {
    try {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      // Find company by Stripe customer ID
      const company = await prisma.company.findFirst({
        where: { stripeCustomerId: customerId }
      });

      if (company) {
        // Record payment in database
        await prisma.payment.create({
          data: {
            companyId: company.id,
            stripePaymentIntentId: invoice.payment_intent,
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency,
            status: 'succeeded',
            paymentMethod: 'card',
            description: invoice.description,
            metadata: JSON.stringify(invoice.metadata)
          }
        });

        // Create invoice record
        await prisma.invoice.create({
          data: {
            companyId: company.id,
            stripeInvoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid / 100,
            status: 'paid',
            pdfUrl: invoice.invoice_pdf,
            issuedAt: new Date(invoice.created * 1000),
            paidAt: new Date()
          }
        });

        console.log(`Payment succeeded for company ${company.id}: $${invoice.amount_paid / 100}`);
      }
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
    }
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(event: any): Promise<void> {
    try {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      // Find company by Stripe customer ID
      const company = await prisma.company.findFirst({
        where: { stripeCustomerId: customerId }
      });

      if (company) {
        // Record failed payment
        await prisma.payment.create({
          data: {
            companyId: company.id,
            stripePaymentIntentId: invoice.payment_intent,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            status: 'failed',
            paymentMethod: 'card',
            description: invoice.description,
            metadata: JSON.stringify(invoice.metadata)
          }
        });

        console.log(`Payment failed for company ${company.id}: $${invoice.amount_due / 100}`);
      }
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
    }
  }

  /**
   * Log webhook events for monitoring
   */
  private async logWebhookEvent(
    eventType: string,
    source: string,
    success: boolean
  ): Promise<void> {
    try {
      // Log webhook events for monitoring purposes
      console.log(`Webhook ${success ? 'success' : 'failure'}: ${eventType} from ${source}`);
    } catch (error) {
      console.error('Error logging webhook event:', error);
    }
  }
}