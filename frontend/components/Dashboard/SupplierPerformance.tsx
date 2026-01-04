import React from 'react';
import { Truck, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Card from '@/components/Common/Card';
import type { SupplierData } from '@/types';

interface SupplierPerformanceProps {
  data: SupplierData | null;
  loading?: boolean;
}

const SupplierPerformance: React.FC<SupplierPerformanceProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <Card title="Supplier Performance" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  const getColorClass = (value: number) => {
    if (value >= 90) return 'text-green-600 bg-green-50';
    if (value >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getIcon = (value: number) => {
    if (value >= 90) return <CheckCircle2 className="h-4 w-4" />;
    if (value >= 70) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <Card title="Supplier Performance" className="h-full">
      <div className="space-y-4">
        {/* Average Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded-lg ${getColorClass(data.avgOnTime)}`}>
            <div className="flex items-center space-x-2">
              {getIcon(data.avgOnTime)}
              <span className="text-xs font-medium">Avg On-Time</span>
            </div>
            <p className="text-xl font-bold mt-1">{data.avgOnTime}%</p>
          </div>

          <div className={`p-3 rounded-lg ${getColorClass(data.avgQuality)}`}>
            <div className="flex items-center space-x-2">
              {getIcon(data.avgQuality)}
              <span className="text-xs font-medium">Avg Quality</span>
            </div>
            <p className="text-xl font-bold mt-1">{data.avgQuality}%</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-gray-600">
              <Truck className="h-4 w-4" />
              <span className="text-xs font-medium">Avg Lead Time</span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{data.avgLeadTime} days</p>
          </div>
        </div>

        {/* Top Suppliers */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
            Top Suppliers
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.topSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="border border-green-200 rounded-lg p-3 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">{supplier.name}</p>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">On-Time</p>
                    <p className="font-semibold text-green-700">{supplier.onTime}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quality</p>
                    <p className={`font-semibold ${getColorClass(supplier.quality).split(' ')[0]}`}>
                      {supplier.quality}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Lead Time</p>
                    <p className="font-semibold text-gray-700">{supplier.leadTime}d</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underperforming Suppliers */}
        {data.underperforming.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
              Underperforming
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {data.underperforming.map((supplier) => (
                <div
                  key={supplier.id}
                  className="border border-red-200 rounded-lg p-3 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">{supplier.name}</p>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-gray-500">On-Time</p>
                      <p className="font-semibold text-red-700">{supplier.onTime}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quality</p>
                      <p className={`font-semibold ${getColorClass(supplier.quality).split(' ')[0]}`}>
                        {supplier.quality}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lead Time</p>
                      <p className="font-semibold text-red-700">{supplier.leadTime}d</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {supplier.issues.map((issue, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SupplierPerformance;
