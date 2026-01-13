/**
 * Dashboard API Integration Layer
 * Handles all communication with the backend dashboard endpoints
 */

import apiClient from '@/utils/api';
import type {
  InventoryData,
  OpenOrdersData,
  SupplierData,
  DemandData,
  KPIData,
  ApiResponse,
} from '@/types';

// API Configuration
const API_TIMEOUT = 15000; // 15 seconds
const CACHE_DURATION = 30000; // 30 seconds cache for auto-refresh

// Cache management
const cache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Get cached data if still valid
 */
const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
};

/**
 * Set data in cache
 */
const setCacheData = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Clear cache for a specific key or all keys
 */
const clearCache = (key?: string): void => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

// API Response Types
export interface InventoryApiResponse extends ApiResponse<InventoryData> {}
export interface OpenOrdersApiResponse extends ApiResponse<OpenOrdersData> {}
export interface SupplierApiResponse extends ApiResponse<SupplierData> {}
export interface DemandApiResponse extends ApiResponse<DemandData> {}
export interface KPIApiResponse extends ApiResponse<KPIData> {}

// Query Parameter Types
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
  period?: string; // e.g., "2025-01"
  name?: 'OTIF' | 'DIO' | 'FILL_RATE' | 'TURNOVER';
}

/**
 * Build query string from params object
 */
const buildQueryString = (params: Record<string, unknown>): string => {
  const queryParts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
};

/**
 * Fetch inventory data from the backend
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to inventory data
 */
export const fetchInventoryData = async (params?: InventoryQueryParams): Promise<InventoryData> => {
  const cacheKey = `inventory${buildQueryString(params || {})}`;
  const cachedData = getCachedData<InventoryData>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const queryString = params ? buildQueryString(params) : '';
  
  try {
    const response = await apiClient.get<InventoryApiResponse>(
      `/api/dashboard/inventory${queryString}`,
      { timeout: API_TIMEOUT }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch inventory data');
    }

    setCacheData(cacheKey, response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    throw error;
  }
};

/**
 * Fetch open orders data from the backend
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to open orders data
 */
export const fetchOpenOrdersData = async (params?: OrdersQueryParams): Promise<OpenOrdersData> => {
  const cacheKey = `orders${buildQueryString(params || {})}`;
  const cachedData = getCachedData<OpenOrdersData>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const queryString = params ? buildQueryString(params) : '';
  
  try {
    const response = await apiClient.get<OpenOrdersApiResponse>(
      `/api/dashboard/orders${queryString}`,
      { timeout: API_TIMEOUT }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch orders data');
    }

    setCacheData(cacheKey, response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching orders data:', error);
    throw error;
  }
};

/**
 * Fetch supplier performance data from the backend
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to supplier data
 */
export const fetchSupplierData = async (params?: SupplierQueryParams): Promise<SupplierData> => {
  const cacheKey = `suppliers${buildQueryString(params || {})}`;
  const cachedData = getCachedData<SupplierData>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const queryString = params ? buildQueryString(params) : '';
  
  try {
    const response = await apiClient.get<SupplierApiResponse>(
      `/api/dashboard/suppliers${queryString}`,
      { timeout: API_TIMEOUT }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch supplier data');
    }

    setCacheData(cacheKey, response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching supplier data:', error);
    throw error;
  }
};

/**
 * Fetch demand forecast data from the backend
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to demand data
 */
export const fetchDemandData = async (params?: DemandQueryParams): Promise<DemandData> => {
  const cacheKey = `demand${buildQueryString(params || {})}`;
  const cachedData = getCachedData<DemandData>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const queryString = params ? buildQueryString(params) : '';
  
  try {
    const response = await apiClient.get<DemandApiResponse>(
      `/api/dashboard/demand${queryString}`,
      { timeout: API_TIMEOUT }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch demand data');
    }

    setCacheData(cacheKey, response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching demand data:', error);
    throw error;
  }
};

/**
 * Fetch KPI data from the backend
 * @param params - Optional query parameters for filtering
 * @returns Promise resolving to KPI data
 */
export const fetchKPIData = async (params?: KPIQueryParams): Promise<KPIData> => {
  const cacheKey = `kpis${buildQueryString(params || {})}`;
  const cachedData = getCachedData<KPIData>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const queryString = params ? buildQueryString(params) : '';
  
  try {
    const response = await apiClient.get<KPIApiResponse>(
      `/api/dashboard/kpis${queryString}`,
      { timeout: API_TIMEOUT }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch KPI data');
    }

    setCacheData(cacheKey, response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    throw error;
  }
};

/**
 * Fetch all dashboard data in parallel
 * @param params - Optional query parameters for each endpoint
 * @returns Promise resolving to all dashboard data
 */
export const fetchAllDashboardData = async (
  params?: {
    inventory?: InventoryQueryParams;
    orders?: OrdersQueryParams;
    suppliers?: SupplierQueryParams;
    demand?: DemandQueryParams;
    kpis?: KPIQueryParams;
  }
): Promise<{
  inventory: InventoryData;
  orders: OpenOrdersData;
  suppliers: SupplierData;
  demand: DemandData;
  kpis: KPIData;
}> => {
  const [inventory, orders, suppliers, demand, kpis] = await Promise.all([
    fetchInventoryData(params?.inventory),
    fetchOpenOrdersData(params?.orders),
    fetchSupplierData(params?.suppliers),
    fetchDemandData(params?.demand),
    fetchKPIData(params?.kpis),
  ]);

  return { inventory, orders, suppliers, demand, kpis };
};

/**
 * Clear all dashboard cache
 * Useful after data mutations or logout
 */
export const clearDashboardCache = (): void => {
  clearCache();
};

export default {
  fetchInventoryData,
  fetchOpenOrdersData,
  fetchSupplierData,
  fetchDemandData,
  fetchKPIData,
  fetchAllDashboardData,
  clearDashboardCache,
};
