import React from 'react';
import Badge from '../ui/Badge';
import { IndianRupee } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function ReorderAlert({ suggestions = [] }) {
  const needsReorder = suggestions.filter(s => s.needs_reorder);
  const totalCost = needsReorder.reduce((sum, item) => sum + item.estimated_cost, 0);

  if (needsReorder.length === 0) {
    return <p className="text-green-600 text-sm font-medium">All stock levels are healthy. No reorders needed right now.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center">
        <p className="text-sm font-medium text-indigo-900">
          <span className="font-bold">{needsReorder.length}</span> items need reordering
        </p>
        <p className="text-sm font-bold text-indigo-900 flex items-center">
          Est. Cost: <IndianRupee size={14} className="ml-1 mr-0.5" /> {formatCurrency(totalCost).replace('₹', '')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {needsReorder.map((item) => {
          let stripeColor = 'bg-gray-400';
          if (item.urgency === 'critical') stripeColor = 'bg-red-500';
          else if (item.urgency === 'urgent') stripeColor = 'bg-orange-500';
          else if (item.urgency === 'soon') stripeColor = 'bg-amber-400';

          const progressPercent = Math.min(100, Math.max(0, (item.current_stock / (item.reorder_point || 1)) * 100));

          return (
            <div key={item.product_id} className="relative bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripeColor}`} />

              <div className="p-4 pl-5 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-800">{item.product_name}</h4>
                    <p className="text-xs text-gray-500">SKU: {item.sku} | Supplier: {item.supplier_name}</p>
                  </div>
                  <Badge status={item.urgency === 'critical' ? 'OUT' : 'PENDING'} label={item.urgency.toUpperCase()} />
                </div>

                <div className="mt-3 mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Stock: {item.current_stock}</span>
                    <span>Reorder pt: {item.reorder_point}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${item.urgency === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-2 mt-3 text-xs flex justify-between items-center">
                  <div>
                    <span className="block text-gray-500">Suggested Order</span>
                    <span className="font-bold text-gray-800">{item.suggested_reorder_qty} units</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-gray-500">Est. Cost</span>
                    <span className="font-bold text-gray-800">{formatCurrency(item.estimated_cost)}</span>
                  </div>
                </div>

                <p className="text-xs font-medium text-red-600 mt-3">
                  {item.action_message}
                </p>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 p-2 pl-5">
                <button
                  onClick={() => alert(`Purchase order generated for ${item.supplier_name}`)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Generate PO →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
