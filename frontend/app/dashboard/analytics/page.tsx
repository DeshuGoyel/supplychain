'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'otif' | 'inventory' | 'suppliers' | 'leadtime' | 'cost'>('otif');

  const { data: otifData } = useSWR(activeTab === 'otif' ? '/api/analytics/otif?months=12' : null, fetcher);
  const { data: turnsData } = useSWR(activeTab === 'inventory' ? '/api/analytics/turns' : null, fetcher);
  const { data: suppliersData } = useSWR(activeTab === 'suppliers' ? '/api/analytics/suppliers' : null, fetcher);
  const { data: leadTimeData } = useSWR(activeTab === 'leadtime' ? '/api/analytics/lead-time' : null, fetcher);
  const { data: costData } = useSWR(activeTab === 'cost' ? '/api/analytics/cost' : null, fetcher);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const exportCSV = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ format: 'csv' })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'otif' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('otif')}
        >
          OTIF
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'inventory' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'suppliers' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('suppliers')}
        >
          Suppliers
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'leadtime' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('leadtime')}
        >
          Lead Time
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'cost' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('cost')}
        >
          Cost
        </button>
      </div>

      {activeTab === 'otif' && otifData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Current OTIF</p>
                <p className="text-3xl font-bold text-gray-900">{otifData.data.current}%</p>
                <p className="text-sm text-gray-500 mt-1">Target: {otifData.data.target}%</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Average OTIF</p>
                <p className="text-3xl font-bold text-gray-900">{otifData.data.average}%</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-2xl font-bold text-green-600 capitalize">{otifData.data.status}</p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">OTIF Trend (12 Months)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={otifData.data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="OTIF %" />
                  <Bar dataKey="target" fill="#10b981" name="Target %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'inventory' && turnsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Inventory Turns</p>
                <p className="text-3xl font-bold text-gray-900">{turnsData.data.inventoryTurns}</p>
                <p className="text-sm text-gray-500 mt-1">Target: {turnsData.data.target}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">${(turnsData.data.totalValue / 1000000).toFixed(2)}M</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Stock Health</p>
                <p className="text-3xl font-bold text-gray-900">{turnsData.data.stockHealth}%</p>
              </div>
            </Card>
          </div>

          {turnsData.data.byLocation && turnsData.data.byLocation.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Inventory by Location</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={turnsData.data.byLocation}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {turnsData.data.byLocation.map((entry: { name: string; value: number }, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'suppliers' && suppliersData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Avg On-Time</p>
                <p className="text-3xl font-bold text-gray-900">{suppliersData.data.avgOnTime}%</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Avg Quality</p>
                <p className="text-3xl font-bold text-gray-900">{suppliersData.data.avgQuality}%</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Avg Lead Time</p>
                <p className="text-3xl font-bold text-gray-900">{suppliersData.data.avgLeadTime} days</p>
              </div>
            </Card>
          </div>

          {suppliersData.data.topPerformers && suppliersData.data.topPerformers.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Top Performers</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {suppliersData.data.topPerformers.map((supplier: { id: string; name: string; score: number }) => (
                    <div key={supplier.id} className="p-4 bg-green-50 rounded-lg">
                      <p className="font-semibold text-gray-900">{supplier.name}</p>
                      <p className="text-sm text-gray-600">Score: {supplier.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'leadtime' && leadTimeData && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Lead Time by Supplier</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={leadTimeData.data.bySupplier}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leadTime" fill="#8b5cf6" name="Lead Time (days)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {activeTab === 'cost' && costData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Avg Cost/Unit</p>
                <p className="text-3xl font-bold text-gray-900">${costData.data.avgCostPerUnit}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Trend</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {costData.data.trend} {costData.data.trendValue}%
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-sm text-gray-600">Budget Variance</p>
                <p className={`text-2xl font-bold ${costData.data.budgetVariance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(costData.data.budgetVariance).toLocaleString()}
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
