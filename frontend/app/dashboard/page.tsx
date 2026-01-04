'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import InventorySnapshot from '@/components/Dashboard/InventorySnapshot';
import OpenOrders from '@/components/Dashboard/OpenOrders';
import SupplierPerformance from '@/components/Dashboard/SupplierPerformance';
import DemandVsSupply from '@/components/Dashboard/DemandVsSupply';
import KPICards from '@/components/Dashboard/KPICards';
import {
  getInventoryData,
  getOpenOrdersData,
  getSupplierData,
  getDemandData,
  getKPIData,
} from '@/services/dashboardService';
import type {
  InventoryData,
  OpenOrdersData,
  SupplierData,
  DemandData,
  KPIData,
} from '@/types';

export default function DashboardPage() {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [orders, setOrders] = useState<OpenOrdersData | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierData | null>(null);
  const [demand, setDemand] = useState<DemandData | null>(null);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [inv, ord, sup, dem, kp] = await Promise.all([
        getInventoryData(),
        getOpenOrdersData(),
        getSupplierData(),
        getDemandData(),
        getKPIData(),
      ]);
      setInventory(inv);
      setOrders(ord);
      setSuppliers(sup);
      setDemand(dem);
      setKpis(kp);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimeSinceRefresh = () => {
    if (!lastRefresh) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control Tower Dashboard</h1>
          <div className="flex items-center space-x-2 mt-1 text-gray-500">
            <Calendar className="h-4 w-4" />
            <p className="text-sm">{lastRefresh ? formatDate(lastRefresh) : ''}</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <span className="text-xs text-gray-500">Last updated: {getTimeSinceRefresh()}</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Top Row - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InventorySnapshot data={inventory} loading={loading} />
        <OpenOrders data={orders} loading={loading} />
        <KPICards data={kpis} loading={loading} />
      </div>

      {/* Bottom Row - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupplierPerformance data={suppliers} loading={loading} />
        <DemandVsSupply data={demand} loading={loading} />
      </div>

      {/* Data Freshness Indicator */}
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
        <div
          className={`h-2 w-2 rounded-full ${
            lastRefresh && Date.now() - lastRefresh.getTime() < 10000
              ? 'bg-green-500'
              : 'bg-yellow-500'
          }`}
        ></div>
        <span>
          Data is{' '}
          {lastRefresh && Date.now() - lastRefresh.getTime() < 10000
            ? 'fresh'
            : 'stale'}
          {lastRefresh && ` (${getTimeSinceRefresh()})`}
        </span>
      </div>
    </div>
  );
}
