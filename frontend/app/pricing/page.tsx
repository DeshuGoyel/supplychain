'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const pricingTiers = [
  {
    name: 'Starter',
    price: 99,
    description: 'Perfect for small teams getting started',
    features: [
      '1,000 API calls per month',
      '1 GB storage',
      '1 user seat',
      '10 reports per month',
      'Email support',
      'Basic analytics',
    ],
    tier: 'starter',
    popular: false,
  },
  {
    name: 'Growth',
    price: 299,
    description: 'For growing businesses with bigger needs',
    features: [
      '50,000 API calls per month',
      '50 GB storage',
      '5 user seats',
      'Unlimited reports',
      'Priority email support',
      'Advanced analytics',
      'Custom integrations',
      'API access',
    ],
    tier: 'growth',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Custom solutions for large organizations',
    features: [
      'Unlimited API calls',
      'Unlimited storage',
      'Unlimited users',
      'Unlimited reports',
      '24/7 phone support',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'SAML SSO',
      'SLA guarantee (99.9%)',
    ],
    tier: 'enterprise',
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleStartTrial = (tier: string) => {
    if (tier === 'enterprise') {
      window.location.href = 'mailto:sales@supplychain-ai.com?subject=Enterprise Inquiry';
    } else {
      router.push(`/auth/signup?tier=${tier}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Supply Chain AI
            </Link>
            <div className="space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that&apos;s right for your business
          </p>

          <div className="inline-flex items-center bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md transition ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <div
              key={tier.tier}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                tier.popular ? 'ring-4 ring-blue-500' : ''
              }`}
            >
              {tier.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold">
                  MOST POPULAR
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 mb-6">{tier.description}</p>
                <div className="mb-6">
                  {tier.price === null ? (
                    <div className="text-4xl font-bold text-gray-900">Custom</div>
                  ) : (
                    <>
                      <span className="text-5xl font-bold text-gray-900">
                        ${billingCycle === 'annual' ? Math.floor(tier.price * 0.8) : tier.price}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /{billingCycle === 'annual' ? 'month' : 'month'}
                      </span>
                      {billingCycle === 'annual' && (
                        <div className="text-sm text-gray-500 mt-1">
                          Billed annually at ${Math.floor(tier.price * 0.8 * 12)}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleStartTrial(tier.tier)}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    tier.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.tier === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
                <ul className="mt-8 space-y-4">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens after the 14-day trial?
              </h3>
              <p className="text-gray-600">
                After your trial ends, you&apos;ll need to choose a paid plan to continue using the
                service. We&apos;ll send you reminders before your trial expires.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately with prorated billing.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                Yes, we offer a 30-day money-back guarantee. If you&apos;re not satisfied, contact us
                for a full refund.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, MasterCard, American Express) and ACH for
                Enterprise customers.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Need help choosing the right plan?
          </p>
          <a
            href="mailto:sales@supplychain-ai.com"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contact our sales team →
          </a>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/pricing" className="text-gray-400 hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/api/legal/terms" className="text-gray-400 hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/api/legal/privacy" className="text-gray-400 hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/api/legal/dpa" className="text-gray-400 hover:text-white">
                    Data Processing Agreement
                  </Link>
                </li>
                <li>
                  <Link href="/api/legal/sla" className="text-gray-400 hover:text-white">
                    Service Level Agreement
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="mailto:support@supplychain-ai.com"
                    className="text-gray-400 hover:text-white"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <p className="text-gray-400 text-sm">
                © 2025 Supply Chain AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
