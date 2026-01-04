// Dashboard data service with mock data
// Phase 2: Replace with real API calls to backend

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

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getInventoryData(): Promise<InventoryData> {
  await delay(300); // Simulate network delay
  
  return {
    totalSKUs: 245,
    stockValue: 1200000,
    lowStockCount: 12,
    stockHealth: 94,
    fastMovers: [
      { sku: 'SKU-001', qty: 450 },
      { sku: 'SKU-002', qty: 380 },
      { sku: 'SKU-003', qty: 275 },
      { sku: 'SKU-004', qty: 220 },
      { sku: 'SKU-005', qty: 195 },
    ],
    slowMovers: [
      { sku: 'SKU-987', qty: 12 },
      { sku: 'SKU-654', qty: 8 },
      { sku: 'SKU-321', qty: 6 },
      { sku: 'SKU-159', qty: 5 },
      { sku: 'SKU-753', qty: 3 },
    ],
  };
}

export async function getOpenOrdersData(): Promise<OpenOrdersData> {
  await delay(250);
  
  return {
    pending: 23,
    delayed: 3,
    onTime: 87,
    orders: [
      {
        id: 'ORD-001',
        supplierId: 'SUP-001',
        supplierName: 'Acme Corp',
        status: 'DELAYED',
        eta: '2026-01-08',
        daysOverdue: 3,
        priority: 'HIGH',
      },
      {
        id: 'ORD-002',
        supplierId: 'SUP-002',
        supplierName: 'Tech Supplies',
        status: 'ON_TIME',
        eta: '2026-01-06',
        priority: 'MEDIUM',
      },
      {
        id: 'ORD-003',
        supplierId: 'SUP-003',
        supplierName: 'Global Parts Inc',
        status: 'ON_TIME',
        eta: '2026-01-07',
        priority: 'LOW',
      },
      {
        id: 'ORD-004',
        supplierId: 'SUP-004',
        supplierName: 'Fast Logistics',
        status: 'DELAYED',
        eta: '2026-01-09',
        daysOverdue: 2,
        priority: 'HIGH',
      },
      {
        id: 'ORD-005',
        supplierId: 'SUP-001',
        supplierName: 'Acme Corp',
        status: 'PENDING',
        eta: '2026-01-10',
        priority: 'MEDIUM',
      },
    ],
  };
}

export async function getSupplierData(): Promise<SupplierData> {
  await delay(350);
  
  return {
    avgOnTime: 92,
    avgQuality: 96,
    avgLeadTime: 8.5,
    topSuppliers: [
      {
        id: 'SUP-001',
        name: 'Acme Corp',
        onTime: 98,
        quality: 99,
        leadTime: 7,
      },
      {
        id: 'SUP-002',
        name: 'Tech Supplies',
        onTime: 95,
        quality: 94,
        leadTime: 9,
      },
      {
        id: 'SUP-005',
        name: 'Prime Materials',
        onTime: 96,
        quality: 97,
        leadTime: 6,
      },
    ],
    underperforming: [
      {
        id: 'SUP-004',
        name: 'Slow Shipper Inc',
        onTime: 78,
        quality: 85,
        leadTime: 14,
        issues: ['Low on-time rate', 'High lead time'],
      },
      {
        id: 'SUP-006',
        name: 'Budget Supplies Ltd',
        onTime: 82,
        quality: 88,
        leadTime: 12,
        issues: ['Quality below threshold'],
      },
    ],
  };
}

export async function getDemandData(): Promise<DemandData> {
  await delay(200);
  
  return {
    forecast: [
      {
        week: 1,
        demand: 520,
        supply: 500,
        gap: -20,
        riskLevel: 'RISK',
      },
      {
        week: 2,
        demand: 480,
        supply: 480,
        gap: 0,
        riskLevel: 'CAUTION',
      },
      {
        week: 3,
        demand: 530,
        supply: 580,
        gap: 50,
        riskLevel: 'SAFE',
      },
      {
        week: 4,
        demand: 510,
        supply: 540,
        gap: 30,
        riskLevel: 'SAFE',
      },
    ],
  };
}

export async function getKPIData(): Promise<KPIData> {
  await delay(250);
  
  return {
    otif: {
      value: 96,
      trend: 2,
      status: 'EXCELLENT',
      target: 95,
    },
    dio: {
      value: 45,
      trend: -3,
      status: 'ON_TRACK',
      target: 50,
    },
    fillRate: {
      value: 98,
      trend: 1,
      status: 'EXCELLENT',
      target: 98,
    },
    turnover: {
      value: 6.2,
      trend: 0.3,
      status: 'ON_TRACK',
      target: 5,
    },
  };
}
