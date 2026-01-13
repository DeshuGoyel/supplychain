export interface User {
  id: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'PLANNER' | 'COORDINATOR' | 'FINANCE';
  companyId: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  companyName: string;
  industry: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Generic API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// Dashboard Types
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
