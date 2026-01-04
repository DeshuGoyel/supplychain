import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Card from '@/components/Common/Card';
import type { DemandData } from '@/types';

interface DemandVsSupplyProps {
  data: DemandData | null;
  loading?: boolean;
}

const DemandVsSupply: React.FC<DemandVsSupplyProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <Card title="Demand vs Supply (4-Week Forecast)" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  const chartData = data.forecast.map((week) => ({
    name: `Week ${week.week}`,
    demand: week.demand,
    supply: week.supply,
    gap: week.gap,
  }));

  const getGapColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'SAFE':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'CAUTION':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'RISK':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGapIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'SAFE':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'CAUTION':
        return <AlertTriangle className="h-4 w-4" />;
      case 'RISK':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getGapLabel = (gap: number) => {
    if (gap > 0) return `+${gap} units (SAFE)`;
    if (gap < 0) return `${gap} units (RISK)`;
    return '0 units (OK)';
  };

  return (
    <Card title="Demand vs Supply (4-Week Forecast)" className="h-full">
      <div className="space-y-4">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="demand" fill="#3b82f6" name="Demand" radius={[4, 4, 0, 0]} />
              <Bar dataKey="supply" fill="#22c55e" name="Supply" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gap Analysis */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Gap Analysis
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {data.forecast.map((week) => (
              <div
                key={week.week}
                className={`border rounded-lg p-3 ${getGapColor(week.riskLevel)}`}
              >
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {getGapIcon(week.riskLevel)}
                  <span className="text-xs font-medium">Week {week.week}</span>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{getGapLabel(week.gap)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Demand</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Supply</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DemandVsSupply;
