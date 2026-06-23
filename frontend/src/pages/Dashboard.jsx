import { useEffect, useState, useMemo } from 'react';
import { Package, IndianRupee, AlertTriangle, Users, ShoppingCart, Warehouse, Menu } from 'lucide-react';
import Layout from '../components/layout/Layout';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StockBarChart from '../components/charts/StockBarChart';
import TransactionLineChart from '../components/charts/TransactionLineChart';
import { dashboardAPI, productsAPI, ordersAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateTime, toArray, formatOrderId } from '../utils/helpers';
import toast from 'react-hot-toast';

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
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, lowStockRes, ordersRes, txnsRes, insightsRes, productsRes] = await Promise.all([
          dashboardAPI.getStats(),
          productsAPI.getLowStock(),
          ordersAPI.getAll({ limit: 5 }),
          dashboardAPI.getRecentTransactions(),
          dashboardAPI.getAIInsights(),
          productsAPI.getAll()
        ]);
        
        setStats(statsRes);
        setLowStockProducts(toArray(lowStockRes).slice(0, 5));
        setRecentOrders(toArray(ordersRes?.orders).slice(0, 5));
        setRecentTxns(toArray(txnsRes));
        setAiInsights(toArray(insightsRes?.insights).slice(0, 5));
        setAllProducts(toArray(productsRes));
      } catch (error) {
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
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

        {/* Row 1 & 2 - 6 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Products"
            value={stats?.total_products ?? 0}
            icon={Package}
            color="indigo"
            subtitle={`${stats?.low_stock_count ?? 0} low stock`}
          />
          <StatCard
            title="Total Customers"
            value={stats?.total_customers ?? 0}
            icon={Users}
            color="purple"
            subtitle="Registered customers"
          />
          <StatCard
            title="Total Orders"
            value={stats?.total_orders ?? 0}
            icon={ShoppingCart}
            color="blue"
            subtitle={`${stats?.pending_orders ?? 0} pending`}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.total_revenue ?? 0)}
            icon={IndianRupee}
            color="green"
            subtitle="From completed orders"
          />
          <StatCard
            title="Inventory Value"
            value={formatCurrency(stats?.total_inventory_value ?? 0)}
            icon={Warehouse}
            color="amber"
            subtitle="Current stock value"
          />
          <StatCard
            title="Low Stock Items"
            value={stats?.low_stock_count ?? 0}
            icon={AlertTriangle}
            color="red"
            subtitle="Need reordering"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StockBarChart data={allProducts} />
          <TransactionLineChart data={lineData} />
        </div>

        {/* Low Stock Products & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Products table */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-1.5">
                <span>⚠️</span> Low Stock Products
              </h2>
              <Link to="/products?low_stock=true" className="text-indigo-600 text-sm hover:underline font-semibold">
                View all →
              </Link>
            </div>
            
            {lowStockProducts.length === 0 ? (
              <p className="text-green-600 text-center py-8 font-medium">
                ✅ All products are well stocked!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[340px]">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-2">Product</th>
                      <th className="pb-2">SKU</th>
                      <th className="pb-2">Stock</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map(product => (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-800 text-sm">{product.name}</td>
                        <td className="py-3 text-gray-500 font-mono text-xs">{product.sku}</td>
                        <td className="py-3">
                          <span className={product.quantity === 0 ? "text-red-600 font-bold text-sm" : "text-amber-600 font-bold text-sm"}>
                            {product.quantity} units
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge status={product.quantity === 0 ? "critical" : "warning"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Orders section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-1.5">
                <span>🛒</span> Recent Orders
              </h2>
              <Link to="/orders" className="text-indigo-600 text-sm hover:underline font-semibold">
                View all →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-8 font-medium">
                No orders yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between py-3 hover:bg-gray-50/30 rounded-lg px-2">
                    <div>
                      <p className="font-mono text-sm text-gray-800 font-semibold">
                        {formatOrderId(order.id)}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 font-medium">
                        {order.customer_name}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-bold text-sm text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <Badge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transactions and AI Stock Insights */}
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
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors font-bold"
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
                    <p className="text-xs text-indigo-600 font-medium mt-1.5 font-bold">
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
