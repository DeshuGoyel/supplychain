'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CreditCard, Calendar, TrendingUp, ArrowUp, ArrowDown, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  maxUsers: number;
  maxApiCalls: number;
  maxStorageGb: number;
}

interface SubscriptionDetails {
  status: string;
  tier: string;
  trialStart: string | null;
  trialEnd: string | null;
  nextBillingDate: string | null;
  daysRemaining: number | null;
  plan: Plan | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  upcomingInvoice: {
    amount: number;
    currency: string;
    dueDate: string;
  } | null;
}

interface Usage {
  apiCalls: number;
  storage: number;
  percentages: {
    apiCalls: number;
    storage: number;
  };
  limits: {
    apiCalls: number;
    storage: number;
  };
}

export default function SubscriptionManagementPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [subRes, plansRes, usageRes, portalRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/details`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/plans`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/usage/limits`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/portal`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSubscription(subRes.data.subscription);
      setPlans(plansRes.data.plans || []);
      setUsage(usageRes.data);
      setPortalUrl(portalRes.data.url);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setProcessingAction('upgrade');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/upgrade`,
        { newPriceId: priceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Successfully upgraded to ${response.data.subscription.tier} plan`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upgrade failed');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDowngrade = async (priceId: string) => {
    setProcessingAction('downgrade');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/downgrade`,
        { newPriceId: priceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Downgrade scheduled for ${response.data.subscription.tier} plan`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Downgrade failed');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? This action can be reversed until the end of your billing period.')) {
      return;
    }

    setProcessingAction('cancel');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/cancel`,
        { cancelAtPeriodEnd: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Subscription will be cancelled at the end of the billing period');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cancellation failed');
    } finally {
      setProcessingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.tier === subscription?.tier);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>

      {/* Current Subscription Status */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Current Subscription</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center text-blue-600 mb-2">
              <CreditCard className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <p className="text-2xl font-bold capitalize">{subscription?.status || 'Unknown'}</p>
            <p className="text-sm text-gray-600 mt-1">
              {subscription?.status === 'cancelling' ? 'Cancels at period end' : 'Active subscription'}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center text-green-600 mb-2">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Current Plan</span>
            </div>
            <p className="text-2xl font-bold capitalize">{currentPlan?.name || subscription?.tier || 'Unknown'}</p>
            <p className="text-sm text-gray-600 mt-1">${currentPlan?.monthlyPrice || 0}/month</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center text-purple-600 mb-2">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Next Billing</span>
            </div>
            <p className="text-2xl font-bold">
              {subscription?.nextBillingDate 
                ? new Date(subscription.nextBillingDate).toLocaleDateString()
                : 'N/A'}
            </p>
            {subscription?.upcomingInvoice && (
              <p className="text-sm text-gray-600 mt-1">
                ${subscription.upcomingInvoice.amount.toFixed(2)}
              </p>
            )}
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center text-orange-600 mb-2">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Days Remaining</span>
            </div>
            <p className="text-2xl font-bold">{subscription?.daysRemaining ?? 'N/A'}</p>
            <p className="text-sm text-gray-600 mt-1">In current period</p>
          </div>
        </div>

        {portalUrl && (
          <div className="mt-6 pt-6 border-t">
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage billing in Stripe Customer Portal
            </a>
          </div>
        )}
      </div>

      {/* Usage Overview */}
      {usage && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Current Usage</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">API Calls</span>
                <span className="text-sm text-gray-600">
                  {usage.usage.apiCalls.toLocaleString()} / {usage.limits.apiCalls.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    usage.percentages.apiCalls > 90 ? 'bg-red-500' :
                    usage.percentages.apiCalls > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usage.percentages.apiCalls, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{usage.percentages.apiCalls}% used</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Storage</span>
                <span className="text-sm text-gray-600">
                  {usage.usage.storage.toFixed(2)} / {usage.limits.storage} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    usage.percentages.storage > 90 ? 'bg-red-500' :
                    usage.percentages.storage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usage.percentages.storage, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{usage.percentages.storage}% used</p>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.tier === subscription?.tier;
            const isUpgrade = plans.findIndex(p => p.tier === plan.tier) > 
                            plans.findIndex(p => p.tier === subscription?.tier);

            return (
              <div 
                key={plan.id} 
                className={`border rounded-lg p-6 ${
                  isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {isCurrent && (
                  <div className="flex items-center justify-center mb-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {plan.maxUsers} users
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {plan.maxApiCalls.toLocaleString()} API calls/mo
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {plan.maxStorageGb} GB storage
                  </li>
                  {(plan.features as string[]).map((feature, i) => (
                    <li key={i} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-2 rounded-md cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => handleUpgrade(plan.stripePriceId)}
                      disabled={processingAction === 'upgrade'}
                      className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      <ArrowUp className="w-4 h-4 mr-2" />
                      {processingAction === 'upgrade' ? 'Upgrading...' : 'Upgrade'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDowngrade(plan.stripePriceId)}
                      disabled={processingAction === 'downgrade'}
                      className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 flex items-center justify-center"
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      {processingAction === 'downgrade' ? 'Processing...' : 'Downgrade'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancel Subscription */}
        {subscription?.status === 'active' && (
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={handleCancel}
              disabled={processingAction === 'cancel'}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              {processingAction === 'cancel' ? 'Processing...' : 'Cancel Subscription'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
