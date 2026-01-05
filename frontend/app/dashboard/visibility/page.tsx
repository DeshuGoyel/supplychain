'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import Alert from '@/components/Common/Alert';

export default function VisibilityPage() {
  const [page, setPage] = useState(1);
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR(
    `/api/shipments?page=${page}&limit=50&status=active`,
    fetcher
  );

  const { data: delayedData } = useSWR('/api/shipments/exceptions', fetcher);
  const { data: carriersData } = useSWR('/api/shipments/carriers', fetcher);

  const toggleShipment = (id: string) => {
    setExpandedShipment(expandedShipment === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT':
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'DELAYED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <Alert variant="error">Failed to load shipment data. Please try again.</Alert>
      </div>
    );
  }

  const shipments = data?.data?.shipments || [];
  const delayedShipments = delayedData?.data || [];
  const carriers = carriersData?.data || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Visibility & Tracking</h1>

      {delayedShipments.length > 0 && (
        <Alert variant="error">
          <strong>{delayedShipments.length} shipments</strong> are delayed. Review and take action.
        </Alert>
      )}

      <Card>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Active Shipments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ETA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Late</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shipments.map((shipment: { 
                id: string; 
                trackingNumber: string; 
                carrier: string; 
                status: string; 
                fromLocation: string; 
                toLocation: string; 
                eta: string; 
                isDelayed: boolean; 
                daysLate: number;
                orderReference?: string;
                totalValue?: number;
                items?: Array<{ name?: string; sku: string; quantity: number }>;
              }) => (
                <>
                  <tr 
                    key={shipment.id}
                    className={`hover:bg-gray-50 cursor-pointer ${shipment.isDelayed ? 'bg-red-50' : ''}`}
                    onClick={() => toggleShipment(shipment.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {shipment.trackingNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.fromLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.toLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.carrier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.daysLate > 0 ? (
                        <span className="text-red-600 font-semibold">{shipment.daysLate} days</span>
                      ) : (
                        'On time'
                      )}
                    </td>
                  </tr>
                  {expandedShipment === shipment.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Shipment Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Order Reference:</p>
                                <p className="font-medium">{shipment.orderReference || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total Value:</p>
                                <p className="font-medium">${shipment.totalValue?.toFixed(2) || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                          {shipment.items && shipment.items.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                              <ul className="list-disc list-inside text-sm text-gray-600">
                                {shipment.items.map((item: { name?: string; sku: string; quantity: number }, idx: number) => (
                                  <li key={idx}>{item.name || item.sku} - Qty: {item.quantity}</li>
                                ))}
                              </ul>
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
            Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, pagination.totalCount || 0)} of {pagination.totalCount || 0} results
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="secondary" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      {carriers.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Carrier Performance</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">On-Time %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Days Late</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Shipments</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {carriers.map((carrier: { carrier: string; onTimeRate: number; avgDaysLate: number; totalShipments?: number }, idx: number) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {carrier.carrier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {carrier.onTimeRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {carrier.avgDaysLate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {carrier.totalShipments}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
