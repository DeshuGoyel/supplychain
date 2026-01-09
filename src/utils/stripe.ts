import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Pricing tier configuration
export const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    priceMonthly: 99,
    priceAnnual: 950, // 20% discount
    limits: {
      apiCalls: 1000,
      storage: 1, // GB
      users: 1,
      reports: 10
    }
  },
  growth: {
    name: 'Growth',
    priceMonthly: 299,
    priceAnnual: 2870, // 20% discount
    limits: {
      apiCalls: 50000,
      storage: 50, // GB
      users: 5,
      reports: -1 // unlimited
    }
  },
  enterprise: {
    name: 'Enterprise',
    priceMonthly: 0, // custom pricing
    priceAnnual: 0,
    limits: {
      apiCalls: -1, // unlimited
      storage: -1, // unlimited
      users: -1, // unlimited
      reports: -1 // unlimited
    }
  }
};

// Get Stripe price ID for a tier and billing cycle
export const getStripePriceId = (tier: string, billingCycle: 'monthly' | 'annual'): string => {
  const priceIds: Record<string, Record<string, string>> = {
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
      annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || ''
    },
    growth: {
      monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || '',
      annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL || ''
    },
    enterprise: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
      annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || ''
    }
  };

  return priceIds[tier]?.[billingCycle] || '';
};

// Create a Stripe customer
export const createStripeCustomer = async (email: string, name: string, companyId: string): Promise<Stripe.Customer> => {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      companyId
    }
  });
};

// Create a subscription with trial period
export const createTrialSubscription = async (
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription> => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 14,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel'
      }
    },
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    }
  });
};

// Update subscription (upgrade/downgrade)
export const updateSubscription = async (
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  if (!subscription.items.data[0]) {
    throw new Error('Subscription has no items');
  }
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId
    }],
    proration_behavior: 'create_prorations'
  });
};

// Cancel subscription
export const cancelSubscription = async (
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> => {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  }
};

// Get invoices for a customer
export const getCustomerInvoices = async (customerId: string): Promise<Stripe.Invoice[]> => {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 100
  });
  return invoices.data;
};

// Create usage record
export const createUsageRecord = async (
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<Stripe.UsageRecord> => {
  return await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action: 'increment'
    }
  );
};
