import React from 'react';
import { ShieldCheck, AlertCircle, TrendingUp, Info } from 'lucide-react';

export default function HealthScoreCard({ data }) {
  if (!data) return null;

  const getScoreColor = (grade) => {
    switch(grade) {
      case 'A': return 'text-green-500 border-green-500';
      case 'B': return 'text-teal-500 border-teal-500';
      case 'C': return 'text-yellow-500 border-yellow-500';
      case 'D': return 'text-orange-500 border-orange-500';
      case 'F': return 'text-red-500 border-red-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  const getScoreBg = (grade) => {
    switch(grade) {
      case 'A': return 'bg-green-50';
      case 'B': return 'bg-teal-50';
      case 'C': return 'bg-yellow-50';
      case 'D': return 'bg-orange-50';
      case 'F': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-shrink-0 flex flex-col items-center justify-center">
          <div className={`w-40 h-40 rounded-full border-[12px] flex flex-col items-center justify-center ${getScoreColor(data.grade)} bg-white shadow-inner`}>
            <span className="text-5xl font-black">{data.overall_score}</span>
            <span className="text-sm font-bold text-gray-500 mt-1">Grade {data.grade}</span>
          </div>
          <h3 className="font-bold text-gray-800 mt-4 text-center">Inventory Health Score</h3>
        </div>

        <div className="flex-grow w-full">
          <h4 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Grade Distribution</h4>
          <div className="flex items-end h-32 gap-2 mb-2">
            {['A', 'B', 'C', 'D', 'F'].map(g => {
              const count = data.grade_distribution[g] || 0;
              const height = data.total_products > 0 ? (count / data.total_products) * 100 : 0;
              return (
                <div key={g} className="flex-1 flex flex-col items-center justify-end group">
                  <span className="text-xs font-bold text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                  <div
                    className={`w-full rounded-t-md transition-all ${getScoreBg(g).replace('50', '400')}`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <span className="text-xs font-bold mt-2 text-gray-600">{g}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 bg-blue-50 text-blue-800 text-sm rounded-lg p-3">
            <ul className="list-disc list-inside space-y-1">
              {data.summary_insights?.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={20} />
            Top Performing Products
          </h4>
          <div className="space-y-3">
            {data.top_performing?.map(p => (
              <div key={p.product_id} className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-100">
                <span className="font-semibold text-gray-800">{p.product_name}</span>
                <span className="font-black text-green-600 text-lg">{p.overall_score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            Needs Attention
          </h4>
          <div className="space-y-3">
            {data.needs_attention?.map(p => (
              <div key={p.product_id} className="flex justify-between items-center p-3 rounded-lg bg-red-50 border border-red-100">
                <span className="font-semibold text-gray-800">{p.product_name}</span>
                <span className="font-black text-red-600 text-lg">{p.overall_score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
