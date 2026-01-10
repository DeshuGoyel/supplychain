'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [subRes, plansRes, invRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/subscription`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/plans`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/invoices`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setSubscription(subRes.data.subscription);
      setPlans(plansRes.data.plans);
      setInvoices(invRes.data.invoices);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/checkout`, { priceId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Failed to initiate checkout');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Billing & Subscription</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Plan</h2>
          <p className="text-2xl font-bold mt-2 capitalize">{subscription?.subscriptionTier || 'Starter'}</p>
          <p className="text-sm text-gray-500 mt-1 capitalize">{subscription?.subscriptionStatus || 'Trial'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Next Billing Date</h2>
          <p className="text-2xl font-bold mt-2">
            {subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Trial Ends</h2>
          <p className="text-2xl font-bold mt-2">
            {subscription?.trialEnd ? new Date(subscription.trialEnd).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.length > 0 ? plans.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-lg shadow border-2 border-transparent hover:border-blue-500 transition-colors">
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-3xl font-bold mt-4">${plan.monthlyPrice}<span className="text-sm text-gray-500 font-normal">/mo</span></p>
            <ul className="mt-6 space-y-2">
              {(plan.features as string[]).map((feature, i) => (
                <li key={i} className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleUpgrade(plan.stripePriceId)}
              className="mt-8 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {subscription?.subscriptionTier === plan.tier ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        )) : (
          <div className="col-span-3 text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No plans configured yet. Check back soon!</p>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">Invoice History</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(invoice.issuedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${invoice.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {invoice.pdfUrl && (
                    <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                      Download PDF
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No invoices found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
