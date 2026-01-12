'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function PaymentMethodPage() {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [billingInfo, setBillingInfo] = useState({
    billingEmail: '',
    billingAddress: '',
    taxId: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/billing-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBillingInfo(response.data.billingInfo);
    } catch (error) {
      console.error('Error fetching billing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBillingInfo = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/billing-info`, billingInfo, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Billing information updated successfully');
    } catch (error) {
      toast.error('Failed to update billing information');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      const token = localStorage.getItem('token');
      // This would integrate with Stripe Payment Element
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/setup-intent`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // You would render the Stripe Payment Element here
      console.log('Setup intent created:', response.data);
      toast.success('Payment method setup initiated');
    } catch (error) {
      toast.error('Failed to set up payment method');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payment Methods</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Billing Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Billing Email</label>
              <input
                type="email"
                value={billingInfo.billingEmail}
                onChange={(e) => setBillingInfo({...billingInfo, billingEmail: e.target.value})}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="billing@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Billing Address</label>
              <textarea
                value={billingInfo.billingAddress}
                onChange={(e) => setBillingInfo({...billingInfo, billingAddress: e.target.value})}
                rows={3}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID (Optional)</label>
              <input
                type="text"
                value={billingInfo.taxId}
                onChange={(e) => setBillingInfo({...billingInfo, taxId: e.target.value})}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Tax ID or VAT number"
              />
            </div>

            <button
              onClick={handleSaveBillingInfo}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Billing Information'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Payment Methods</h2>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">•••• •••• •••• 4242</h3>
                  <p className="text-sm text-gray-500">Expires 12/26</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Primary</span>
                  <button className="text-red-600 text-sm hover:underline">Remove</button>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddPaymentMethod}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
            >
              <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm text-gray-600">Add payment method</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Secure Payments
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              All payments are processed securely through Stripe. We never store your payment information on our servers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}