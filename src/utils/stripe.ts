import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia' as any,
  typescript: true,
});

// Pricing tiers configuration
export const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    price: 99,
    priceId: process.env.STRIPE_PRICE_STARTER || '',
    features: {
      apiCalls: 1000,
      storage: 1, // GB
      users: 1,
      reports: 10,
    },
  },
  growth: {
    name: 'Growth',
    price: 299,
    priceId: process.env.STRIPE_PRICE_GROWTH || '',
    features: {
      apiCalls: 50000,
      storage: 50, // GB
      users: 5,
      reports: -1, // unlimited
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 0, // Custom pricing
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
    features: {
      apiCalls: -1, // unlimited
      storage: -1, // unlimited
      users: -1, // unlimited
      reports: -1, // unlimited
    },
  },
};

export const TRIAL_PERIOD_DAYS = 14;

// Helper function to get tier limits
export function getTierLimits(tier: string) {
  const tierKey = tier as keyof typeof PRICING_TIERS;
  return PRICING_TIERS[tierKey]?.features || PRICING_TIERS.starter.features;
}

// Helper function to check if usage exceeds limits
export function checkUsageLimit(
  usage: number,
  limit: number,
  softLimitPercent: number = 0.8
): { exceeded: boolean; softLimit: boolean; percentage: number } {
  if (limit === -1) {
    return { exceeded: false, softLimit: false, percentage: 0 };
  }
  const percentage = usage / limit;
  return {
    exceeded: usage >= limit,
    softLimit: usage >= limit * softLimitPercent,
    percentage: percentage * 100,
  };
}
