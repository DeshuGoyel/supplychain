import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Package, Star } from 'lucide-react';
import Card from '@/components/Common/Card';
import type { OpenOrdersData } from '@/types';

interface OpenOrdersProps {
  data: OpenOrdersData | null;
  loading?: boolean;
}

const OpenOrders: React.FC<OpenOrdersProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <Card title="Open Orders" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-blue-100 text-blue-700';
      case 'DELAYED':
        return 'bg-red-100 text-red-700';
      case 'ON_TIME':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      case 'DELAYED':
        return <AlertTriangle className="h-3 w-3" />;
      case 'ON_TIME':
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'LOW':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card title="Open Orders" className="h-full">
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1 text-blue-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-1">{data.pending}</p>
          </div>

          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Delayed</span>
            </div>
            <p className="text-2xl font-bold text-red-700 mt-1">{data.delayed}</p>
          </div>

          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">On-Time</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{data.onTime}</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Orders</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.orders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-0.5">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-gray-900">{order.id}</p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.replace('_', '-')}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate" title={order.supplierName}>
                        {order.supplierName}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs text-gray-500">ETA: {formatDate(order.eta)}</span>
                        {order.daysOverdue && (
                          <span className="text-xs text-red-600 font-medium">
                            {order.daysOverdue} days overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {order.priority === 'HIGH' && (
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(order.priority)}`}>
                      <Star className="h-3 w-3 fill-current" />
                      <span>High</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OpenOrders;
