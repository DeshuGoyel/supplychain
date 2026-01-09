'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Common/Loading';

interface Subscription {
  tier: string;
  status: string;
  trialStart?: string;
  trialEnd?: string;
  nextBillingDate?: string;
  billingCycle?: string;
  cancelAtPeriodEnd?: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  pdfUrl?: string | null;
  createdAt: string;
}

export default function BillingSettingsPage() {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const [subRes, invRes] = await Promise.all([
          apiClient.get('/api/billing/subscription'),
          apiClient.get('/api/billing/invoices')
        ]);

        setSubscription(subRes.data.subscription);
        setInvoices(invRes.data.invoices || []);
      } catch (err: unknown) {
        const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        setError(errorMessage || 'Failed to load billing information');
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [isAuthenticated]);

  const handleUpgrade = async (tier: string) => {
    try {
      await apiClient.post('/api/billing/upgrade', { tier, billingCycle: 'monthly' });
      const subRes = await apiClient.get('/api/billing/subscription');
      setSubscription(subRes.data.subscription);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(errorMessage || 'Failed to upgrade plan');
    }
  };

  const handleCancel = async () => {
    try {
      await apiClient.post('/api/billing/cancel', { immediately: false });
      const subRes = await apiClient.get('/api/billing/subscription');
      setSubscription(subRes.data.subscription);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(errorMessage || 'Failed to cancel subscription');
    }
  };

  if (loading) return <Loading fullPage text="Loading billing settings..." />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        {subscription ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-2xl font-bold text-blue-600 capitalize">{subscription.tier}</p>
                <p className="text-gray-600">Status: {subscription.status}</p>
                {subscription.trialEnd && (
                  <p className="text-sm text-orange-600">
                    Trial ends: {new Date(subscription.trialEnd).toLocaleDateString()}
                  </p>
                )}
                {subscription.nextBillingDate && (
                  <p className="text-sm text-gray-600">
                    Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleUpgrade('growth')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Upgrade
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                Your subscription will cancel at the end of the current billing period.
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No active subscription found.</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Invoice History</h2>
        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium">${invoice.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                  <p className={`text-sm ${invoice.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                    {invoice.status}
                  </p>
                </div>
                {invoice.pdfUrl && (
                  <a
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No invoices found.</p>
        )}
      </div>
    </div>
  );
}
