import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Package, AlertTriangle, Activity, Loader2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ForecastChart from '../components/ai/ForecastChart';
import ReorderAlert from '../components/ai/ReorderAlert';
import AnomalyAlert from '../components/ai/AnomalyAlert';
import HealthScoreCard from '../components/ai/HealthScoreCard';
import { aiAPI } from '../services/aiAPI';

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState('forecast');
  const [data, setData] = useState({
    forecast: null,
    reorder: null,
    anomalies: null,
    health: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {

      const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));

      const apiCalls = Promise.all([
        aiAPI.getForecast(),
        aiAPI.getReorderSuggestions(false),
        aiAPI.getAnomalies(),
        aiAPI.getHealthScore()
      ]);

      const [_, [forecast, reorder, anomalies, health]] = await Promise.all([minLoadTime, apiCalls]);

      setData({ forecast, reorder, anomalies, health });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching AI Insights", err);
      setError("Unable to load AI insights");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tabs = [
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'reorder', label: 'Reorder', icon: Package },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
    { id: 'health', label: 'Health', icon: Activity },
  ];

  return (
    <Layout title="AI Insights">
      <div className="space-y-6 pb-20">

        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                🤖 AI Insights
              </h1>
              <p className="text-indigo-200 mt-1">Powered by machine learning and Gemini AI</p>
            </div>

            <div className="flex flex-col md:items-end">
              <span className="text-xs text-indigo-300 mb-2 block">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 flex overflow-x-auto hide-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap min-w-[120px] ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-indigo-400 gap-4">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
              <p className="animate-pulse font-medium">Analyzing your inventory data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center border border-red-100">
              <AlertTriangle size={32} className="mx-auto mb-3 opacity-80" />
              <h3 className="font-bold text-lg mb-1">{error}</h3>
              <p className="text-sm opacity-80 mb-4">Make sure the backend is running and you have enough data.</p>
              <button
                onClick={fetchData}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'forecast' && (
                <div className="space-y-4">
                  <p className="text-gray-500 mb-4 ml-1">Predicted stockout dates based on your transaction history.</p>
                  <ForecastChart data={data.forecast} />
                </div>
              )}

              {activeTab === 'reorder' && (
                <div className="space-y-4">
                  <p className="text-gray-500 mb-4 ml-1">Smart reorder suggestions to prevent stockouts.</p>
                  <ReorderAlert suggestions={data.reorder} />
                </div>
              )}

              {activeTab === 'anomalies' && (
                <div className="space-y-4">
                  <p className="text-gray-500 mb-4 ml-1">Unusual patterns detected in your inventory movements.</p>
                  <AnomalyAlert anomalies={data.anomalies} />
                </div>
              )}

              {activeTab === 'health' && (
                <div className="space-y-4">
                  <p className="text-gray-500 mb-4 ml-1">Overall inventory health based on stock levels, turnover, and data accuracy.</p>
                  <HealthScoreCard data={data.health} />
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
