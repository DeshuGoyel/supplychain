// Dashboard data service
// Integrates with real backend API for all dashboard widgets

import dashboardApi from './api/dashboardApi';
import type {
  InventoryData,
  OpenOrdersData,
  SupplierData,
  DemandData,
  KPIData,
} from '@/types';

// Query parameter types for API calls
export interface InventoryQueryParams {
  stockLevel?: 'HEALTHY' | 'LOW' | 'OUT_OF_STOCK';
  minStockValue?: number;
  maxStockValue?: number;
}

export interface OrdersQueryParams {
  status?: 'PENDING' | 'ON_TIME' | 'DELAYED' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface SupplierQueryParams {
  status?: 'ACTIVE' | 'INACTIVE';
  minOnTimeRate?: number;
  minQualityRate?: number;
  maxLeadTime?: number;
}

export interface DemandQueryParams {
  weeks?: number;
  year?: number;
  startWeek?: number;
  riskLevel?: 'SAFE' | 'CAUTION' | 'RISK';
}

export interface KPIQueryParams {
  period?: string;
  name?: 'OTIF' | 'DIO' | 'FILL_RATE' | 'TURNOVER';
}

export interface DashboardQueryParams {
  inventory?: InventoryQueryParams;
  orders?: OrdersQueryParams;
  suppliers?: SupplierQueryParams;
  demand?: DemandQueryParams;
  kpis?: KPIQueryParams;
}

// Re-export types from API layer for convenience
export type {
  InventoryData,
  OpenOrdersData,
  SupplierData,
  DemandData,
  KPIData,
};

/**
 * Fetch inventory data for the Inventory Snapshot widget
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to inventory data
 */
export async function getInventoryData(params?: InventoryQueryParams): Promise<InventoryData> {
  return dashboardApi.fetchInventoryData(params);
}

/**
 * Fetch open orders data for the Open Orders widget
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to open orders data
 */
export async function getOpenOrdersData(params?: OrdersQueryParams): Promise<OpenOrdersData> {
  return dashboardApi.fetchOpenOrdersData(params);
}

/**
 * Fetch supplier performance data for the Supplier Performance widget
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to supplier data
 */
export async function getSupplierData(params?: SupplierQueryParams): Promise<SupplierData> {
  return dashboardApi.fetchSupplierData(params);
}

/**
 * Fetch demand forecast data for the Demand vs Supply widget
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to demand data
 */
export async function getDemandData(params?: DemandQueryParams): Promise<DemandData> {
  return dashboardApi.fetchDemandData(params);
}

/**
 * Fetch KPI data for the KPI Cards widget
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to KPI data
 */
export async function getKPIData(params?: KPIQueryParams): Promise<KPIData> {
  return dashboardApi.fetchKPIData(params);
}

/**
 * Fetch all dashboard data in parallel
 * More efficient than calling individual functions
 * @param params - Optional query parameters for each endpoint
 * @returns Promise resolving to all dashboard data
 */
export async function getAllDashboardData(
  params?: DashboardQueryParams
): Promise<{
  inventory: InventoryData;
  orders: OpenOrdersData;
  suppliers: SupplierData;
  demand: DemandData;
  kpis: KPIData;
}> {
  return dashboardApi.fetchAllDashboardData(params);
}

/**
 * Clear all dashboard data cache
 * Useful after data mutations or user logout
 */
export function clearDashboardCache(): void {
  dashboardApi.clearDashboardCache();
}
