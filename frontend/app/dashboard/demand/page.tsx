'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import Alert from '@/components/Common/Alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DemandPage() {
  const [scenario, setScenario] = useState('expected');

  const { data: forecast, error, isLoading } = useSWR('/api/demand/forecast?months=12', fetcher);
  const { data: accuracy } = useSWR('/api/demand/accuracy', fetcher);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error">Failed to load demand data. Please try again.</Alert>
      </div>
    );
  }

  const forecastData = forecast?.data?.forecast || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Demand Planning</h1>

      <div className="flex gap-2">
        <Button 
          variant={scenario === 'best' ? 'primary' : 'secondary'}
          onClick={() => setScenario('best')}
        >
          Best Case (+20%)
        </Button>
        <Button 
          variant={scenario === 'expected' ? 'primary' : 'secondary'}
          onClick={() => setScenario('expected')}
        >
          Expected
        </Button>
        <Button 
          variant={scenario === 'worst' ? 'primary' : 'secondary'}
          onClick={() => setScenario('worst')}
        >
          Worst Case (-15%)
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">12-Month Forecast</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="demand" stroke="#3b82f6" strokeWidth={2} name="Demand" />
              <Line type="monotone" dataKey="supply" stroke="#10b981" strokeWidth={2} name="Supply" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Forecast Data</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Demand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supply</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forecastData.map((item: { month: string; demand: number; supply: number; gap: number; riskLevel: string }, idx: number) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.demand}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.supply}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.gap}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.riskLevel === 'SAFE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {accuracy?.data && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Forecast Accuracy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Average Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{accuracy.data.avgAccuracy}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{accuracy.data.trend}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
