'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function UsageAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsage(response.data.usage);
      setPlan(response.data.plan);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Usage Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">API Calls This Month</h3>
              <p className="text-2xl font-bold text-gray-900">
                {usage?.apiCallsUsed?.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                of {plan?.maxApiCalls?.toLocaleString() || 'Unlimited'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  getUsagePercentage(usage?.apiCallsUsed || 0, plan?.maxApiCalls || 100) >= 90 
                    ? 'bg-red-500' 
                    : getUsagePercentage(usage?.apiCallsUsed || 0, plan?.maxApiCalls || 100) >= 75 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ 
                  width: `${getUsagePercentage(usage?.apiCallsUsed || 0, plan?.maxApiCalls || 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getUsagePercentage(usage?.apiCallsUsed || 0, plan?.maxApiCalls || 100).toFixed(1)}% used
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Storage Used</h3>
              <p className="text-2xl font-bold text-gray-900">
                {((usage?.storageUsedGb || 0) * 1000).toFixed(1)} MB
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                of {plan?.maxStorageGb || 'Unlimited'} GB
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  getUsagePercentage(usage?.storageUsedGb || 0, plan?.maxStorageGb || 100) >= 90 
                    ? 'bg-red-500' 
                    : getUsagePercentage(usage?.storageUsedGb || 0, plan?.maxStorageGb || 100) >= 75 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ 
                  width: `${getUsagePercentage(usage?.storageUsedGb || 0, plan?.maxStorageGb || 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getUsagePercentage(usage?.storageUsedGb || 0, plan?.maxStorageGb || 100).toFixed(1)}% used
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">User Seats</h3>
              <p className="text-2xl font-bold text-gray-900">
                {usage?.usersUsed || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                of {plan?.maxUsers || 'Unlimited'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  getUsagePercentage(usage?.usersUsed || 0, plan?.maxUsers || 100) >= 90 
                    ? 'bg-red-500' 
                    : getUsagePercentage(usage?.usersUsed || 0, plan?.maxUsers || 100) >= 75 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ 
                  width: `${getUsagePercentage(usage?.usersUsed || 0, plan?.maxUsers || 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getUsagePercentage(usage?.usersUsed || 0, plan?.maxUsers || 100).toFixed(1)}% used
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Usage Trends</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Calls (30 days)</span>
              <span className="text-sm font-medium">
                +{usage?.apiCallsTrend || 0}% from last month
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage Growth (30 days)</span>
              <span className="text-sm font-medium">
                +{((usage?.storageUsedGb || 0) * 100).toFixed(1)} MB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Users (30 days)</span>
              <span className="text-sm font-medium">
                {usage?.activeUsers || 0} users
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Plan Information</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Plan</span>
              <span className="text-sm font-medium capitalize">{plan?.name || 'Free'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Next Billing Date</span>
              <span className="text-sm font-medium">
                {usage?.nextBillingDate 
                  ? new Date(usage.nextBillingDate).toLocaleDateString() 
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Plan Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                usage?.subscriptionStatus === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : usage?.subscriptionStatus === 'trial'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {usage?.subscriptionStatus || 'Free'}
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/pricing'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {usage?.apiCallsUsed > (plan?.maxApiCalls * 0.8) && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Usage Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                You're approaching your plan limits. Consider upgrading to avoid service interruption.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}