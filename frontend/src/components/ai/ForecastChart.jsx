import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ShieldAlert, ShieldCheck } from 'lucide-react';
import Badge from '../ui/Badge';

export default function ForecastChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm">No forecast data available. Need more transaction history.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {data.map((item) => {
        const isCritical = item.days_until_stockout !== null && item.days_until_stockout < 7;
        const isWarning = item.days_until_stockout !== null && item.days_until_stockout >= 7 && item.days_until_stockout < 14;
        const isSafe = item.days_until_stockout === null || item.days_until_stockout >= 14;

        let trendIcon, trendColor;
        if (item.trend === 'increasing') {
          trendIcon = <TrendingUp size={16} />;
          trendColor = 'text-red-500';
        } else if (item.trend === 'decreasing') {
          trendIcon = <TrendingDown size={16} />;
          trendColor = 'text-green-500';
        } else {
          trendIcon = <Minus size={16} />;
          trendColor = 'text-gray-400';
        }

        const chartData = item.chart_data?.filter(d => d.actual_usage !== null).slice(-14) || [];

        return (
          <div key={item.product_id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-800">{item.product_name}</h4>
                <p className="text-xs text-gray-500">Current Stock: {item.current_stock} units</p>
              </div>
              <Badge status={item.confidence === 'high' ? 'IN' : 'OUT'} label={`${item.confidence} conf.`} />
            </div>

            <div className="flex justify-between items-end mb-4 flex-grow">
              <div>
                <p className="text-xs text-gray-500 mb-1">Days until stockout</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-500' : 'text-green-600'}`}>
                    {item.days_until_stockout !== null ? item.days_until_stockout : '∞'}
                  </span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                    {trendIcon} {item.trend}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Avg Usage</p>
                <p className="text-sm font-semibold">{item.avg_daily_usage} / day</p>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="h-16 w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`colorUsage-${item.product_id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                    <Area
                      type="monotone"
                      dataKey="actual_usage"
                      stroke="#4f46e5"
                      fillOpacity={1}
                      fill={`url(#colorUsage-${item.product_id})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
