// Dashboard data service
// Now integrated with real backend API

import apiClient from '@/utils/api';

export interface InventoryData {
  totalSKUs: number;
  stockValue: number;
  lowStockCount: number;
  stockHealth: number;
  fastMovers: Array<{ sku: string; qty: number }>;
  slowMovers: Array<{ sku: string; qty: number }>;
}

export interface OpenOrdersData {
  pending: number;
  delayed: number;
  onTime: number;
  orders: Array<{
    id: string;
    supplierId: string;
    supplierName: string;
    status: 'PENDING' | 'DELAYED' | 'ON_TIME';
    eta: string;
    daysOverdue?: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export interface SupplierData {
  avgOnTime: number;
  avgQuality: number;
  avgLeadTime: number;
  topSuppliers: Array<{
    id: string;
    name: string;
    onTime: number;
    quality: number;
    leadTime: number;
  }>;
  underperforming: Array<{
    id: string;
    name: string;
    onTime: number;
    quality: number;
    leadTime: number;
    issues: string[];
  }>;
}

export interface DemandData {
  forecast: Array<{
    week: number;
    demand: number;
    supply: number;
    gap: number;
    riskLevel: 'SAFE' | 'CAUTION' | 'RISK';
  }>;
}

export interface KPIData {
  otif: {
    value: number;
    trend: number;
    status: 'EXCELLENT' | 'ON_TRACK' | 'AT_RISK';
    target: number;
  };
  dio: {
    value: number;
    trend: number;
    status: 'EXCELLENT' | 'ON_TRACK' | 'AT_RISK';
    target: number;
  };
  fillRate: {
    value: number;
    trend: number;
    status: 'EXCELLENT' | 'ON_TRACK' | 'AT_RISK';
    target: number;
  };
  turnover: {
    value: number;
    trend: number;
    status: 'EXCELLENT' | 'ON_TRACK' | 'AT_RISK';
    target: number;
  };
}

export async function getInventoryData(): Promise<InventoryData> {
  const response = await apiClient.get<{ success: boolean; data: InventoryData }>('/api/dashboard/inventory');

  if (!response.data.success) {
    throw new Error('Failed to fetch inventory data');
  }

  return response.data.data;
}

export async function getOpenOrdersData(): Promise<OpenOrdersData> {
  const response = await apiClient.get<{ success: boolean; data: OpenOrdersData }>('/api/dashboard/orders');

  if (!response.data.success) {
    throw new Error('Failed to fetch orders data');
  }

  return response.data.data;
}

export async function getSupplierData(): Promise<SupplierData> {
  const response = await apiClient.get<{ success: boolean; data: SupplierData }>('/api/dashboard/suppliers');

  if (!response.data.success) {
    throw new Error('Failed to fetch supplier data');
  }

  return response.data.data;
}

export async function getDemandData(): Promise<DemandData> {
  const response = await apiClient.get<{ success: boolean; data: DemandData }>('/api/dashboard/demand');

  if (!response.data.success) {
    throw new Error('Failed to fetch demand data');
  }

  return response.data.data;
}

export async function getKPIData(): Promise<KPIData> {
  const response = await apiClient.get<{ success: boolean; data: KPIData }>('/api/dashboard/kpis');

  if (!response.data.success) {
    throw new Error('Failed to fetch KPI data');
  }

  return response.data.data;
}
