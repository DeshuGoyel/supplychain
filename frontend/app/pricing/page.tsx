'use client';

import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const tiers = [
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    annual: '$950/year (save 20%)',
    description: 'Perfect for small businesses getting started',
    features: [
      '1,000 API calls/month',
      '1 GB storage',
      '1 user seat',
      '10 reports/month',
      'Email support',
      'Basic analytics'
    ]
  },
  {
    name: 'Growth',
    price: '$299',
    period: '/month',
    annual: '$2,870/year (save 20%)',
    description: 'For growing companies that need more power',
    popular: true,
    features: [
      '50,000 API calls/month',
      '50 GB storage',
      '5 user seats',
      'Unlimited reports',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
      'API access'
    ]
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    annual: 'Contact sales',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited API calls',
      'Unlimited storage',
      'Unlimited users',
      'Unlimited reports',
      '24/7 phone support',
      'White-label branding',
      'SAML SSO',
      'Custom SLA',
      'Dedicated account manager',
      'Custom contracts'
    ]
  }
];

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl ${
                tier.popular
                  ? 'border-2 border-blue-600 shadow-2xl scale-105'
                  : 'border border-gray-200 shadow-lg'
              } bg-white p-8 transition-transform hover:scale-105`}
            >
              {tier.popular && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32 bg-blue-600 text-white py-1 px-4 rounded-full text-sm font-semibold text-center">
                  Most Popular
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-600">{tier.period}</span>
                </div>
                <p className="text-sm text-blue-600 mb-4">{tier.annual}</p>
                <p className="text-gray-600 mb-6">{tier.description}</p>
              </div>

              <button
                onClick={() => router.push('/auth/signup')}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors mb-6 ${
                  tier.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
              </button>

              <ul className="space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-8">
            All plans include our core features: real-time analytics, demand forecasting, and supplier management
          </p>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">99.9%</p>
              <p className="text-gray-600">Uptime SLA</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">24/7</p>
              <p className="text-gray-600">Support</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">14 days</p>
              <p className="text-gray-600">Free Trial</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
