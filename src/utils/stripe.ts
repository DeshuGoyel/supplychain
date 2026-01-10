import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export const PLANS = {
  STARTER: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      'Up to 5 users',
      '10,000 API calls/month',
      '10GB storage',
      'Basic inventory tracking',
      'Standard support'
    ]
  },
  GROWTH: {
    name: 'Growth',
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      'Up to 25 users',
      '100,000 API calls/month',
      '100GB storage',
      'Advanced analytics',
      'Priority support',
      'Custom integrations'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    features: [
      'Unlimited users',
      'Unlimited API calls',
      'Unlimited storage',
      'White-labeling',
      '24/7 dedicated support',
      'Custom features',
      'SLA guarantee'
    ]
  }
};

export interface CreateCustomerParams {
  email: string;
  name: string;
  companyName: string;
  taxId?: string;
  billingAddress?: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
}

export async function createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      companyName: params.companyName,
      taxId: params.taxId || '',
      billingAddress: params.billingAddress || ''
    }
  });

  return customer;
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: params.customerId,
    items: [{ price: params.priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  };

  if (params.trialDays) {
    subscriptionData.trial_period_days = params.trialDays;
  }

  const subscription = await stripe.subscriptions.create(subscriptionData);
  return subscription;
}

export async function createCheckoutSession(
  priceId: string,
  customerId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });

  return session;
}

export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  return await stripe.customers.retrieve(customerId) as Stripe.Customer;
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId);
}

export async function updateSubscription(
  subscriptionId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

export async function getInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });
  return invoices.data;
}

export async function getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  return await stripe.invoices.retrieve(invoiceId, {
    expand: ['customer', 'subscription'],
  });
}

export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_WEBHOOK_SECRET
  );
}

export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  customerId?: string
): Promise<Stripe.PaymentIntent> {
  const params: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: { enabled: true },
  };

  if (customerId) {
    params.customer = customerId;
  }

  return await stripe.paymentIntents.create(params);
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      console.log('Checkout session completed:', event.data.object.id);
      // Handle successful checkout
      break;
    
    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object.id);
      // Handle subscription updates
      break;
    
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', event.data.object.id);
      // Handle subscription cancellation
      break;
    
    case 'invoice.payment_succeeded':
      console.log('Invoice payment succeeded:', event.data.object.id);
      // Handle successful payment
      break;
    
    case 'invoice.payment_failed':
      console.log('Invoice payment failed:', event.data.object.id);
      // Handle failed payment
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}