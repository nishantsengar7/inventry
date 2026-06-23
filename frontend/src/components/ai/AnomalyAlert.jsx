import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

export default function AnomalyAlert({ anomalies = [] }) {
  if (anomalies.length === 0) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-green-100 p-3 rounded-full mb-3">
          <CheckCircle2 className="text-green-600" size={32} />
        </div>
        <h3 className="text-green-800 font-semibold mb-1">No Anomalies Detected</h3>
        <p className="text-green-600 text-sm">Your inventory patterns look normal and healthy.</p>
      </div>
    );
  }

  const txAnomalies = anomalies.filter(a => a.z_score !== undefined);
  const stockAnomalies = anomalies.filter(a => a.anomaly_type !== undefined);

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'critical':
      case 'high': return <AlertCircle className="text-red-500" size={20} />;
      case 'medium':
      case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
      case 'info': return <Info className="text-blue-500" size={20} />;
      default: return <Info size={20} />;
    }
  };

  const getSeverityBg = (severity) => {
    switch(severity) {
      case 'critical':
      case 'high': return 'bg-red-50 border-red-100';
      case 'medium':
      case 'warning': return 'bg-amber-50 border-amber-100';
      case 'info': return 'bg-blue-50 border-blue-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {stockAnomalies.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Stock Pattern Anomalies</h3>
          <div className="space-y-3">
            {stockAnomalies.map((a, i) => (
              <div key={`sa-${i}`} className={`rounded-xl p-4 border flex items-start gap-3 shadow-sm ${getSeverityBg(a.severity)}`}>
                <div className="mt-0.5">{getSeverityIcon(a.severity)}</div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-800">{a.product_name}</h4>
                    <span className="text-xs text-gray-500">{formatDateTime(a.detected_at)}</span>
                  </div>
                  <p className="text-sm font-semibold mt-1 text-gray-700">{a.anomaly_type}</p>
                  <p className="text-xs text-gray-600 mt-1">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {txAnomalies.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Transaction Anomalies</h3>
          <div className="space-y-3">
            {txAnomalies.map((a, i) => (
              <div key={`ta-${i}`} className={`rounded-xl p-4 border flex items-start gap-3 shadow-sm ${getSeverityBg(a.severity)}`}>
                <div className="mt-0.5">{getSeverityIcon(a.severity)}</div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-800">{a.product_name}</h4>
                    <span className="text-xs text-gray-500">{formatDateTime(a.transaction_date)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${a.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {a.type}
                    </span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                      Qty: {a.quantity}
                    </span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                      Z-Score: {a.z_score}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-2 text-gray-700">{a.reason}</p>

                  <div className="mt-3 text-right">
                    <button className="text-xs font-semibold text-indigo-600 hover:underline">
                      Review Transaction →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
