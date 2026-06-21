import { useEffect, useState } from 'react'
import {
  Package, Tag, Truck, ArrowLeftRight,
  TrendingUp, TrendingDown, AlertTriangle, DollarSign
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import api from '../services/api'

// ── Mock data (replace with real API calls) ───────────────────
const MOCK_STATS = [
  { label: 'Total Products',   value: '1,284', delta: '+12',  Icon: Package,       color: 'text-primary-400',  bg: 'bg-primary-900/30'  },
  { label: 'Categories',       value: '42',    delta: '+3',   Icon: Tag,           color: 'text-success-500',  bg: 'bg-success-900/30'  },
  { label: 'Suppliers',        value: '138',   delta: '-2',   Icon: Truck,         color: 'text-warning-500',  bg: 'bg-warning-900/30'  },
  { label: 'Transactions',     value: '3,920', delta: '+240', Icon: ArrowLeftRight, color: 'text-danger-400',  bg: 'bg-danger-900/30'   },
]

const MOCK_AREA = [
  { month: 'Jan', stock_in: 400, stock_out: 240 },
  { month: 'Feb', stock_in: 300, stock_out: 139 },
  { month: 'Mar', stock_in: 600, stock_out: 380 },
  { month: 'Apr', stock_in: 800, stock_out: 430 },
  { month: 'May', stock_in: 500, stock_out: 380 },
  { month: 'Jun', stock_in: 900, stock_out: 430 },
]

const MOCK_BAR = [
  { category: 'Electronics', count: 320 },
  { category: 'Clothing',    count: 210 },
  { category: 'Food',        count: 180 },
  { category: 'Furniture',   count: 140 },
  { category: 'Tools',       count: 90  },
]

const MOCK_LOW_STOCK = [
  { id: 1, name: 'Wireless Mouse',   qty: 3,  threshold: 10 },
  { id: 2, name: 'USB-C Cables',     qty: 5,  threshold: 20 },
  { id: 3, name: 'Notebook A4',      qty: 8,  threshold: 50 },
  { id: 4, name: 'HDMI Adapter',     qty: 2,  threshold: 15 },
]

// ── Tooltip styles for recharts ───────────────────────────────
const chartTooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
}

export default function Dashboard() {
  const [stats] = useState(MOCK_STATS)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here's what's happening today.</p>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, delta, Icon, color, bg }) => (
          <div key={label} className="stat-card group hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${
                delta.startsWith('+') ? 'text-success-500' : 'text-danger-400'
              }`}>
                {delta.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {delta}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="text-sm text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart – stock movement */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Stock Movement (6 months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_AREA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Area type="monotone" dataKey="stock_in"  stroke="#3b82f6" fill="url(#gradIn)"  strokeWidth={2} name="Stock In"  />
              <Area type="monotone" dataKey="stock_out" stroke="#ef4444" fill="url(#gradOut)" strokeWidth={2} name="Stock Out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart – products per category */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Products by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_BAR} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="category" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} name="Products" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Low Stock Alerts ────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <AlertTriangle size={16} className="text-warning-500" />
          <h2 className="text-base font-semibold text-slate-200">Low Stock Alerts</h2>
          <span className="badge badge-yellow ml-auto">{MOCK_LOW_STOCK.length} items</span>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Current Qty</th>
                <th>Min Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LOW_STOCK.map((item, i) => (
                <tr key={item.id}>
                  <td className="text-slate-500">{i + 1}</td>
                  <td className="font-medium text-slate-200">{item.name}</td>
                  <td className="text-danger-400 font-semibold">{item.qty}</td>
                  <td className="text-slate-400">{item.threshold}</td>
                  <td>
                    <span className={`badge ${item.qty <= 3 ? 'badge-red' : 'badge-yellow'}`}>
                      {item.qty <= 3 ? 'Critical' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
