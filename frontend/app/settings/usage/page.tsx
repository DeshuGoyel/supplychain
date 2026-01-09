'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Common/Loading';

interface UsageData {
  usage: Record<string, number>;
  limits: Record<string, number>;
  tier: string;
  percentages: Record<string, number>;
}

export default function UsagePage() {
  const { isAuthenticated } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUsage = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/api/billing/usage');
        setUsageData(res.data);
      } catch (err: unknown) {
        const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
        setError(errorMessage || 'Failed to load usage data');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [isAuthenticated]);

  if (loading) return <Loading fullPage text="Loading usage..." />;

  if (!usageData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">{error || 'No usage data available'}</p>
      </div>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Usage & Limits</h1>
      <p className="text-gray-600 mb-8">Current plan: <span className="font-semibold capitalize">{usageData.tier}</span></p>

      <div className="grid md:grid-cols-2 gap-6">
        {Object.keys(usageData.usage).map((metric) => {
          const usage = usageData.usage[metric] || 0;
          const limit = usageData.limits[metric] || 0;
          const percentage = usageData.percentages[metric] || 0;

          return (
            <div key={metric} className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                {metric.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{usage.toLocaleString()} used</span>
                  <span>{formatLimit(limit)} limit</span>
                </div>
                
                {limit !== -1 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{percentage.toFixed(1)}% used</p>
                    
                    {percentage >= 80 && (
                      <div className={`mt-2 text-sm ${percentage >= 90 ? 'text-red-600' : 'text-yellow-600'}`}>
                        ⚠️ {percentage >= 90 ? 'Critical: Approaching limit!' : 'Warning: High usage'}
                      </div>
                    )}
                  </>
                )}
                
                {limit === -1 && (
                  <p className="text-sm text-green-600 mt-2">✓ Unlimited on your plan</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Need more?</h3>
        <p className="text-blue-800 mb-4">
          Upgrade your plan to get higher limits and unlock more features.
        </p>
        <a
          href="/settings/billing"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upgrade Plan
        </a>
      </div>
    </div>
  );
}
