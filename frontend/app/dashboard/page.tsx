'use client';

import React from 'react';
import Card from '@/components/Common/Card';
import { useAuth } from '@/hooks/useAuth';
import { 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  Clock,
  BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { name: 'Active Issues', value: '12', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'On-time Delivery', value: '94.2%', icon: Clock, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Inventory Level', value: '82%', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Predicted Growth', value: '+14%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-gray-500">Here&apos;s what&apos;s happening in your supply chain today.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700">
            Generate Insights
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} contentClassName="p-5">
            <div className="flex items-center">
              <div className={`${stat.bg} p-3 rounded-md`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="text-lg font-bold text-gray-900">{stat.value}</dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Critical Issues" description="Supply chain disruptions that require immediate attention.">
          <div className="space-y-4 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="mt-1">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Shipment Delay: Route Suez-A{i}</p>
                  <p className="text-xs text-gray-500 mt-1">Expected delay of 4 days due to weather conditions. Impacting 120 orders.</p>
                </div>
                <div className="text-xs font-medium text-gray-400">2h ago</div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full text-center py-2 text-sm font-medium text-blue-600 hover:text-blue-500">
            View all issues
          </button>
        </Card>

        <Card title="AI Inventory Prediction" description="Predicted inventory levels for the next 30 days.">
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Visualization will be implemented in Task 3.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
