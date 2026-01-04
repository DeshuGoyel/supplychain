'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Calendar, Wifi, WifiOff, Clock } from 'lucide-react';
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
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const fetchData = useCallback(async () => {
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
      setIsOnline(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError({
        message: errorMessage,
        retryable: !errorMessage.includes('session') && !errorMessage.includes('permission'),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds (increased to account for real API latency)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setError({
        message: 'You appear to be offline. Please check your connection.',
        retryable: true,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

  const getDataFreshnessClass = () => {
    if (!lastRefresh) return 'bg-gray-400';
    const diff = Date.now() - lastRefresh.getTime();
    if (diff < 10000) return 'bg-green-500';
    if (diff < 60000) return 'bg-yellow-500';
    return 'bg-orange-500';
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

  if (error && !inventory && !orders && !suppliers && !demand && !kpis) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                {isOnline ? (
                  <WifiOff className="h-6 w-6 text-red-600" />
                ) : (
                  <Wifi className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="mt-2 text-sm text-red-700">{error.message}</p>
              {error.retryable && (
                <div className="mt-4 flex items-center space-x-3">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Retrying...' : 'Retry'}
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    Reload Page
                  </button>
                </div>
              )}
              {!isOnline && (
                <p className="mt-2 text-xs text-red-600">
                  <Wifi className="h-3 w-3 inline mr-1" />
                  Check your internet connection
                </p>
              )}
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
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <span className="text-xs text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {getTimeSinceRefresh()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing || !isOnline}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Banner (if there's a partial error) */}
      {error && (inventory || orders || suppliers || demand || kpis) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-yellow-700">{error.message}</p>
            </div>
            {error.retryable && (
              <button
                onClick={handleRefresh}
                className="text-sm text-yellow-700 hover:text-yellow-900 font-medium"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

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
        <div className={`h-2 w-2 rounded-full ${getDataFreshnessClass()}`}></div>
        <span>
          Data is{' '}
          {!lastRefresh
            ? 'loading'
            : Date.now() - lastRefresh.getTime() < 10000
            ? 'fresh'
            : Date.now() - lastRefresh.getTime() < 60000
            ? 'current'
            : 'stale'}
          {lastRefresh && ` (${getTimeSinceRefresh()})`}
        </span>
      </div>
    </div>
  );
}

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
