import React from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import Card from '@/components/Common/Card';
import type { InventoryData } from '@/types';

interface InventorySnapshotProps {
  data: InventoryData | null;
  loading?: boolean;
}

const InventorySnapshot: React.FC<InventorySnapshotProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <Card title="Inventory Snapshot" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (health: number) => {
    if (health >= 90) return <CheckCircle className="h-4 w-4" />;
    if (health >= 70) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <Card title="Inventory Snapshot" className="h-full">
      <div className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">Total SKUs</span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{data.totalSKUs}</p>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-600">Stock Value</span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.stockValue)}</p>
          </div>

          <div className={`p-3 rounded-lg ${data.lowStockCount > 10 ? 'bg-red-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`h-4 w-4 ${data.lowStockCount > 10 ? 'text-red-600' : 'text-yellow-600'}`} />
              <span className="text-xs text-gray-600">Low Stock</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-xl font-bold text-gray-900">{data.lowStockCount}</p>
              {data.lowStockCount > 10 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Alert</span>}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className={getHealthColor(data.stockHealth)}>
                {getHealthIcon(data.stockHealth)}
              </div>
              <span className="text-xs text-gray-600">Stock Health</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className={`text-xl font-bold ${getHealthColor(data.stockHealth)}`}>{data.stockHealth}%</p>
            </div>
          </div>
        </div>

        {/* Fast Movers */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
            Fast Movers (Top 5)
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.fastMovers.map((item, index) => (
              <div
                key={item.sku}
                className="flex items-center justify-between p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-green-700">{index + 1}.</span>
                  <span className="text-sm font-medium text-gray-900">{item.sku}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.qty} units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slow Movers */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
            Slow Movers (Bottom 5)
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.slowMovers.map((item, index) => (
              <div
                key={item.sku}
                className="flex items-center justify-between p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-red-700">{index + 1}.</span>
                  <span className="text-sm font-medium text-gray-900">{item.sku}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.qty} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InventorySnapshot;
