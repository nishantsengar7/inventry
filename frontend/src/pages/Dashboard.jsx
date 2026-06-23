import { useEffect, useState, useMemo } from 'react';
import { Package, Tag, IndianRupee, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import Layout from '../components/layout/Layout';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StockBarChart from '../components/charts/StockBarChart';
import TransactionLineChart from '../components/charts/TransactionLineChart';
import { dashboardAPI, productsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateTime, toArray } from '../utils/helpers';

function buildLineChartData(transactions) {
  const list = toArray(transactions);
  const map = {};
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    map[key] = { date: key, in: 0, out: 0 };
  }

  list.forEach((t) => {
    const key = new Date(t.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (map[key]) {
      if (t.type === 'IN')  map[key].in  += t.quantity;
      if (t.type === 'OUT') map[key].out += t.quantity;
    }
  });

  return Object.values(map);
}

export default function Dashboard() {
  const [stats, setStats]               = useState(null);
  const [recentTxns, setRecentTxns]     = useState([]);
  const [aiInsights, setAiInsights]     = useState([]);
  const [allProducts, setAllProducts]   = useState([]);
  const [allTxns, setAllTxns]           = useState([]);
  const [isLoading, setIsLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getStats(),
      dashboardAPI.getRecentTransactions(),
      dashboardAPI.getAIInsights(),
      productsAPI.getAll(),
    ])
      .then(([s, txns, insights, products]) => {
        setStats(s);
        setRecentTxns(toArray(txns));
        setAiInsights(toArray(insights?.insights));
        setAllProducts(toArray(products));
        setAllTxns(toArray(txns));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const lineData = useMemo(() => buildLineChartData(recentTxns), [recentTxns]);
  const lowStockCount = stats?.low_stock_count ?? 0;

  if (isLoading) {
    return (
      <Layout title="Dashboard">
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" lowStockCount={lowStockCount}>
      <div className="space-y-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={stats?.total_products ?? 0}
            icon={<Package size={22} />}
            color="indigo"
            subtitle="In catalogue"
          />
          <StatCard
            title="Categories"
            value={stats?.total_categories ?? 0}
            icon={<Tag size={22} />}
            color="purple"
          />
          <StatCard
            title="Inventory Value"
            value={formatCurrency(stats?.total_inventory_value ?? 0)}
            icon={<IndianRupee size={22} />}
            color="green"
            subtitle="Current stock value"
          />
          <StatCard
            title="Low Stock Items"
            value={stats?.low_stock_count ?? 0}
            icon={<AlertTriangle size={22} />}
            color="red"
            subtitle={lowStockCount > 0 ? 'Needs attention' : 'All good!'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StockBarChart data={allProducts} />
          <TransactionLineChart data={lineData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Recent Transactions
            </h3>
            {recentTxns.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {recentTxns.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {t.product_name}
                      </p>
                      <p className="text-xs text-gray-400">{formatDateTime(t.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <Badge status={t.type} />
                      <span
                        className={`text-sm font-bold ${
                          t.type === 'IN' ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {t.type === 'IN' ? '+' : '-'}{t.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h3 className="text-base font-semibold text-gray-800">🤖 AI Stock Insights</h3>
                <p className="text-xs text-gray-400 mt-0.5">Smart reorder recommendations</p>
              </div>
              <Link
                to="/ai-insights"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View Full AI Insights →
              </Link>
            </div>
            {aiInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-400 text-sm text-center mb-4">
                  No insights available yet
                </p>
                <Link
                  to="/ai-insights"
                  className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
                >
                  Explore AI Features
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {aiInsights.slice(0, 3).map((insight) => (
                  <div
                    key={insight.product_id}
                    className={`rounded-xl p-3 border ${
                      insight.urgency === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : insight.urgency === 'warning'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {insight.product_name}
                      </p>
                      <Badge status={insight.urgency} />
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>Current stock: <strong>{insight.current_stock} units</strong></p>
                    </div>
                    <p className="text-xs text-indigo-600 font-medium mt-1.5">
                      {insight.reorder_suggestion || 'Check AI Insights for details'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
