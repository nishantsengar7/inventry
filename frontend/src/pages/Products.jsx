import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const MOCK_PRODUCTS = [
  { id: 1, name: 'Wireless Mouse',     sku: 'ELEC-001', category: 'Electronics', qty: 3,   price: 29.99, status: 'Low Stock' },
  { id: 2, name: 'Mechanical Keyboard',sku: 'ELEC-002', category: 'Electronics', qty: 142, price: 89.99, status: 'In Stock'  },
  { id: 3, name: 'Monitor 27"',        sku: 'ELEC-003', category: 'Electronics', qty: 0,   price: 349.0, status: 'Out of Stock'},
  { id: 4, name: 'Office Chair',       sku: 'FURN-001', category: 'Furniture',   qty: 28,  price: 199.0, status: 'In Stock'  },
  { id: 5, name: 'Notebook A4 (Pack)', sku: 'STAT-001', category: 'Stationery', qty: 8,   price: 5.49,  status: 'Low Stock' },
]

function statusBadge(status) {
  const map = {
    'In Stock':     'badge-green',
    'Low Stock':    'badge-yellow',
    'Out of Stock': 'badge-red',
  }
  return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{status}</span>
}

export default function Products() {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalogue</p>
        </div>
        <button id="add-product-btn" className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search bar */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="product-search"
            type="text"
            placeholder="Search by name or SKU…"
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-slate-400 text-xs">{p.sku}</td>
                  <td className="font-medium text-slate-200">{p.name}</td>
                  <td className="text-slate-400">{p.category}</td>
                  <td className={p.qty === 0 ? 'text-danger-400 font-bold' : p.qty < 10 ? 'text-warning-500 font-semibold' : 'text-slate-300'}>
                    {p.qty}
                  </td>
                  <td className="text-slate-300">${p.price.toFixed(2)}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost p-1.5 rounded-md" title="Edit product">
                        <Pencil size={14} />
                      </button>
                      <button className="btn-ghost p-1.5 rounded-md text-danger-400 hover:text-danger-300 hover:bg-danger-900/20" title="Delete product">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-10">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
