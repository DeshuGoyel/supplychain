'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import Input from '@/components/Common/Input';
import Alert from '@/components/Common/Alert';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  location: string;
  quantity: number;
  quantityReserved: number;
  availableQty: number;
  reorderPoint: number | null;
  reorderQty: number | null;
  safetyStock: number | null;
  unitCost: number;
  stockLevel: string;
  daysSupply: number | null;
  supplier: {
    id: string;
    name: string;
  } | null;
  lastUpdated: string;
}

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, error, isLoading } = useSWR(
    `/api/inventory?page=${page}&limit=50&sku=${searchTerm}&location=${locationFilter}&status=${statusFilter}`,
    fetcher
  );

  const { data: lowStockData } = useSWR('/api/inventory/low-stock', fetcher);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStockLevelColor = (daysSupply: number | null) => {
    if (!daysSupply) return 'text-gray-600';
    if (daysSupply > 30) return 'text-green-600 bg-green-50';
    if (daysSupply >= 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

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
        <Alert variant="error">
          Failed to load inventory data. Please try again.
        </Alert>
      </div>
    );
  }

  const inventory = data?.data?.inventory || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <Button onClick={() => window.location.href = '/dashboard/inventory/export'}>
          Export CSV
        </Button>
      </div>

      {lowStockData?.data && lowStockData.data.length > 0 && (
        <Alert variant="warning">
          <strong>{lowStockData.data.length} items</strong> are low or out of stock. Review and reorder.
        </Alert>
      )}

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search SKU or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="">All Locations</option>
              <option value="warehouse-1">Warehouse 1</option>
              <option value="warehouse-2">Warehouse 2</option>
              <option value="retail-1">Retail Store 1</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="HEALTHY">Healthy</option>
              <option value="LOW">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
            <Button variant="secondary" onClick={() => {
              setSearchTerm('');
              setLocationFilter('');
              setStatusFilter('');
            }}>
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty On Hand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Pt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Supply
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item: InventoryItem) => (
                <>
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${getStockLevelColor(item.daysSupply)}`}
                    onClick={() => toggleRow(item.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantityReserved}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.reorderPoint || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.daysSupply ? `${item.daysSupply} days` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Reorder functionality coming soon');
                        }}
                      >
                        Reorder
                      </Button>
                    </td>
                  </tr>
                  {expandedRows.has(item.id) && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700">Supplier:</p>
                            <p className="text-gray-600">{item.supplier?.name || 'Not assigned'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Safety Stock:</p>
                            <p className="text-gray-600">{item.safetyStock || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Reorder Quantity:</p>
                            <p className="text-gray-600">{item.reorderQty || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Unit Cost:</p>
                            <p className="text-gray-600">${item.unitCost.toFixed(2)}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(page - 1) * 50 + 1}</span> to{' '}
            <span className="font-medium">{Math.min(page * 50, pagination.totalCount || 0)}</span> of{' '}
            <span className="font-medium">{pagination.totalCount || 0}</span> results
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
