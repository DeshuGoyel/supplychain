'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

interface Subscription {
  tier: string;
  status: string;
  trialEnd: string | null;
  daysUntilTrialEnd: number | null;
  nextBillingDate: string | null;
  limits: {
    apiCalls: number;
    storage: number;
    users: number;
    reports: number;
  };
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  pdfUrl: string | null;
  invoiceNumber: string | null;
  createdAt: string;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [subResponse, invoiceResponse] = await Promise.all([
        api.get('/billing/subscription'),
        api.get('/billing/invoices'),
      ]);
      setSubscription(subResponse.data.subscription);
      setInvoices(invoiceResponse.data.invoices);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      await api.post('/billing/upgrade', { tier: selectedTier });
      setShowUpgradeModal(false);
      fetchBillingData();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    
    try {
      await api.post('/billing/cancel');
      fetchBillingData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    starter: 'bg-blue-100 text-blue-800',
    growth: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-green-100 text-green-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>

        {subscription?.status === 'trial' && subscription.daysUntilTrialEnd !== null && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Your trial expires in {subscription.daysUntilTrialEnd} days
                </h3>
                <p className="mt-2 text-sm text-yellow-700">
                  Upgrade now to continue using all features without interruption.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center mb-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    tierColors[subscription?.tier || 'starter']
                  }`}
                >
                  {subscription?.tier?.toUpperCase()}
                </span>
                {subscription?.status === 'trial' && (
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    TRIAL
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-2">
                {subscription?.tier === 'starter' && (
                  <>
                    <strong>$99/month</strong> - Perfect for small teams
                  </>
                )}
                {subscription?.tier === 'growth' && (
                  <>
                    <strong>$299/month</strong> - For growing businesses
                  </>
                )}
                {subscription?.tier === 'enterprise' && (
                  <>
                    <strong>Custom pricing</strong> - For large organizations
                  </>
                )}
              </p>
              {subscription?.nextBillingDate && (
                <p className="text-gray-500 text-sm mt-2">
                  Next billing date:{' '}
                  {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="space-x-3">
              {subscription?.tier !== 'enterprise' && (
                <button
                  onClick={() => {
                    setSelectedTier(
                      subscription?.tier === 'starter' ? 'growth' : 'enterprise'
                    );
                    setShowUpgradeModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Upgrade Plan
                </button>
              )}
              {subscription?.status === 'active' && (
                <button
                  onClick={handleCancelSubscription}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Limits</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-gray-500 text-sm">API Calls/Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscription?.limits.apiCalls === -1
                  ? 'Unlimited'
                  : subscription?.limits.apiCalls.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Storage</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscription?.limits.storage === -1
                  ? 'Unlimited'
                  : `${subscription?.limits.storage} GB`}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">User Seats</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscription?.limits.users === -1
                  ? 'Unlimited'
                  : subscription?.limits.users}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Reports/Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscription?.limits.reports === -1
                  ? 'Unlimited'
                  : subscription?.limits.reports}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice History</h2>
          {invoices.length === 0 ? (
            <p className="text-gray-500">No invoices yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${invoice.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Download PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Upgrade to {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
              </h3>
              <p className="text-gray-600 mb-6">
                You&apos;ll be charged a prorated amount for the rest of your billing cycle.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpgrade}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Confirm Upgrade
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
