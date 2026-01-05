'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import Alert from '@/components/Common/Alert';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  performanceScore: number;
  onTimeRate: number;
  qualityRate: number;
  leadTime: number;
  paymentTerms: string | null;
  status: string;
  totalPOs: number;
}

interface PO {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  dueDate: string | null;
  receivedDate: string | null;
  itemCount: number;
  createdAt: string;
}

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const { data, error, isLoading } = useSWR(
    `/api/suppliers?page=${page}&limit=50`,
    fetcher
  );

  const { data: supplierDetail } = useSWR(
    expandedSupplier ? `/api/suppliers/${expandedSupplier}` : null,
    fetcher
  );

  const { data: supplierPOs } = useSWR(
    expandedSupplier ? `/api/suppliers/${expandedSupplier}/pos?limit=5` : null,
    fetcher
  );

  const toggleSupplier = (supplier: Supplier) => {
    if (expandedSupplier === supplier.id) {
      setExpandedSupplier(null);
    } else {
      setExpandedSupplier(supplier.id);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
          Failed to load supplier data. Please try again.
        </Alert>
      </div>
    );
  }

  const suppliers = data?.data?.suppliers || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
        <Button onClick={() => alert('Create supplier functionality coming soon')}>
          Add Supplier
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On-Time %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total POs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier: Supplier) => (
                <>
                  <tr 
                    key={supplier.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleSupplier(supplier)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(supplier.performanceScore)}`}>
                        {Math.round(supplier.performanceScore)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.onTimeRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.qualityRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.leadTime} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.totalPOs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSupplier(supplier);
                          setShowCreatePO(true);
                        }}
                      >
                        Create PO
                      </Button>
                    </td>
                  </tr>
                  {expandedSupplier === supplier.id && supplierDetail && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase">Contact Name</p>
                              <p className="mt-1 text-sm text-gray-900">{supplierDetail.data.contactName || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                              <p className="mt-1 text-sm text-gray-900">{supplierDetail.data.contactEmail || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                              <p className="mt-1 text-sm text-gray-900">{supplierDetail.data.contactPhone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase">Payment Terms</p>
                              <p className="mt-1 text-sm text-gray-900">{supplierDetail.data.paymentTerms || 'N/A'}</p>
                            </div>
                          </div>

                          {supplierPOs && supplierPOs.data && supplierPOs.data.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Purchase Orders</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">PO #</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Items</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {supplierPOs.data.map((po: PO) => (
                                      <tr key={po.id}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{po.poNumber}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {new Date(po.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{po.itemCount}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">${po.totalAmount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            {po.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
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

      {showCreatePO && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create Purchase Order</h2>
              <p className="text-sm text-gray-600 mb-4">Supplier: {selectedSupplier.name}</p>
              <Alert variant="info">
                PO creation form coming soon. This will allow you to add line items, set due dates, and submit orders.
              </Alert>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowCreatePO(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
