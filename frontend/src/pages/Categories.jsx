import { useState } from 'react'
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react'

const MOCK_CATEGORIES = [
  { id: 1, name: 'Electronics',  description: 'Electronic devices and accessories', product_count: 462 },
  { id: 2, name: 'Furniture',    description: 'Office and home furniture',           product_count: 89  },
  { id: 3, name: 'Stationery',   description: 'Paper and writing supplies',          product_count: 204 },
  { id: 4, name: 'Clothing',     description: 'Apparel and accessories',             product_count: 313 },
  { id: 5, name: 'Tools',        description: 'Hand tools and power tools',          product_count: 127 },
  { id: 6, name: 'Food & Bev',   description: 'Packaged food and beverages',         product_count: 89  },
]

const PALETTE = [
  'bg-primary-900/40 text-primary-400',
  'bg-success-900/40 text-success-500',
  'bg-warning-900/40 text-warning-500',
  'bg-danger-900/40  text-danger-400',
  'bg-purple-900/40  text-purple-400',
  'bg-cyan-900/40    text-cyan-400',
]

export default function Categories() {
  const [categories] = useState(MOCK_CATEGORIES)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organise products into logical groups</p>
        </div>
        <button id="add-category-btn" className="btn-primary">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <div key={cat.id} className="card-hover p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${PALETTE[i % PALETTE.length]}`}>
                <Tag size={18} />
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5 rounded-md" title="Edit">
                  <Pencil size={14} />
                </button>
                <button className="btn-ghost p-1.5 rounded-md text-danger-400 hover:bg-danger-900/20" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">{cat.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{cat.description}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-500">Total Products</span>
              <span className="text-sm font-semibold text-slate-200">{cat.product_count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
