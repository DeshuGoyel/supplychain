import { Router, Request, Response } from 'express';
import stripe from '../utils/stripe';
import { PrismaClient } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();
const router = Router();

// Stripe requires the raw body to construct the event
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const companyId = session.metadata?.companyId;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (companyId) {
          await prisma.company.update({
            where: { id: companyId },
            data: {
              subscriptionStatus: 'active',
              stripeCustomerId: stripeCustomerId as string,
              stripeSubscriptionId: stripeSubscriptionId as string
            }
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
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
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const company = await prisma.company.findUnique({
          where: { stripeSubscriptionId: subscription.id }
        });

        if (company) {
          await prisma.company.update({
            where: { id: company.id },
            data: {
              subscriptionStatus: 'inactive',
              stripeSubscriptionId: null
            }
          });
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const company = await prisma.company.findUnique({
          where: { stripeCustomerId: invoice.customer }
        });

        if (company) {
          await prisma.invoice.create({
            data: {
              companyId: company.id,
              stripeInvoiceId: invoice.id,
              subscriptionId: invoice.subscription as string,
              amount: invoice.amount_paid / 100,
              status: 'paid',
              pdfUrl: invoice.invoice_pdf,
              paidAt: new Date(),
            }
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const company = await prisma.company.findUnique({
          where: { stripeCustomerId: invoice.customer }
        });

        if (company) {
          await prisma.company.update({
            where: { id: company.id },
            data: {
              subscriptionStatus: 'past_due'
            }
          });
        }
        break;
      }
      case 'invoice.created': {
        const invoice = event.data.object as any;
        const company = await prisma.company.findUnique({
          where: { stripeCustomerId: invoice.customer }
        });

        if (company) {
          await prisma.invoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            update: {
              status: invoice.status,
              amount: (invoice.amount_due || invoice.amount_paid || 0) / 100,
              pdfUrl: invoice.invoice_pdf,
              dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
            },
            create: {
              companyId: company.id,
              stripeInvoiceId: invoice.id,
              subscriptionId: invoice.subscription as string,
              amount: (invoice.amount_due || 0) / 100,
              status: invoice.status || 'draft',
              pdfUrl: invoice.invoice_pdf,
              dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
            }
          });
        }
        break;
      }
      case 'charge.refunded': {
        // Optionally sync refunds to Payment records
        console.log('Charge refunded:', (event.data.object as any).id);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ message: 'Internal Server Error' });
    return;
  }

  res.json({ received: true });
});

export default router;
