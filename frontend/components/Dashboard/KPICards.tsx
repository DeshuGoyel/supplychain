import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import Card from '@/components/Common/Card';
import type { KPIData } from '@/types';

interface KPICardsProps {
  data: KPIData | null;
  loading?: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <Card title="Key Performance Indicators" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'bg-green-50 border-green-200';
      case 'ON_TRACK':
        return 'bg-blue-50 border-blue-200';
      case 'AT_RISK':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Excellent
          </span>
        );
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            On Track
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            At Risk
          </span>
        );
      default:
        return null;
    }
  };

  const KPICard = ({
    title,
    value,
    trend,
    target,
    status,
    unit = '',
    isPercentage = false,
  }: {
    title: string;
    value: number;
    trend: number;
    target: number;
    status: string;
    unit?: string;
    isPercentage?: boolean;
  }) => (
    <div className={`border rounded-lg p-4 ${getStatusColor(status)} hover:shadow-md transition-shadow cursor-pointer`}>
      <div className="mb-2">
        <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-xs text-gray-500">Target: {target}{unit}</p>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-gray-900">
          {isPercentage ? `${value}%` : value}
          {unit && !isPercentage && unit}
        </p>
        <div
          className={`flex items-center space-x-1 text-sm font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4" />
          ) : trend < 0 ? (
            <TrendingDown className="h-4 w-4" />
          ) : null}
          <span>
            {trend > 0 ? '+' : ''}
            {trend}
            {isPercentage ? '%' : unit}
          </span>
        </div>
      </div>
      <div className="mt-2">{getStatusBadge(status)}</div>
    </div>
  );

  return (
    <Card title="Key Performance Indicators" className="h-full">
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="On-Time In-Full"
          value={data.otif.value}
          trend={data.otif.trend}
          target={data.otif.target}
          status={data.otif.status}
          isPercentage={true}
        />
        <KPICard
          title="Days Inventory Outstanding"
          value={data.dio.value}
          trend={data.dio.trend}
          target={data.dio.target}
          status={data.dio.status}
          unit=" days"
        />
        <KPICard
          title="Fill Rate"
          value={data.fillRate.value}
          trend={data.fillRate.trend}
          target={data.fillRate.target}
          status={data.fillRate.status}
          isPercentage={true}
        />
        <KPICard
          title="Inventory Turnover"
          value={data.turnover.value}
          trend={data.turnover.trend}
          target={data.turnover.target}
          status={data.turnover.status}
          unit="x"
        />
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">KPI Definitions:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">OTIF:</span> On-Time In-Full (target: &gt;95%)
          </div>
          <div>
            <span className="font-medium">DIO:</span> Days Inventory Outstanding (target: &lt;50)
          </div>
          <div>
            <span className="font-medium">Fill Rate:</span> % of demand fulfilled (target: &gt;98%)
          </div>
          <div>
            <span className="font-medium">Turnover:</span> Inventory turns per year (target: &gt;5x)
          </div>
        </div>
      </div>
    </Card>
  );
};

export default KPICards;
