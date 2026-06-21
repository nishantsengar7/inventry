import { useState } from 'react'
import { Search, Filter, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

const MOCK_TRANSACTIONS = [
  { id: 'TXN-0001', type: 'IN',  product: 'Wireless Mouse',    qty: 100, date: '2024-06-01', user: 'admin', note: 'Restock from TechCorp' },
  { id: 'TXN-0002', type: 'OUT', product: 'Mechanical Keyboard',qty: 5,  date: '2024-06-02', user: 'jane',  note: 'Sales order #1042'     },
  { id: 'TXN-0003', type: 'IN',  product: 'Monitor 27"',        qty: 20, date: '2024-06-03', user: 'admin', note: 'Monthly restock'        },
  { id: 'TXN-0004', type: 'OUT', product: 'Office Chair',        qty: 3,  date: '2024-06-04', user: 'bob',   note: 'Internal use'          },
  { id: 'TXN-0005', type: 'OUT', product: 'Notebook A4 (Pack)', qty: 12, date: '2024-06-05', user: 'jane',  note: 'Office supplies request' },
]

export default function Transactions() {
  const [transactions] = useState(MOCK_TRANSACTIONS)
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const filtered = transactions.filter((t) => {
    const matchSearch = t.product.toLowerCase().includes(search.toLowerCase()) ||
                        t.id.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === 'ALL' || t.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Full history of stock movements</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="txn-search"
            type="text"
            placeholder="Search by product or ID…"
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'IN', 'OUT'].map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`btn text-xs px-3 py-1.5 ${typeFilter === f ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f === 'ALL' ? 'All' : f === 'IN' ? '↑ Stock In' : '↓ Stock Out'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Date</th>
                <th>By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs text-slate-400">{t.id}</td>
                  <td>
                    {t.type === 'IN' ? (
                      <span className="badge badge-green flex items-center gap-1 w-fit">
                        <ArrowUpCircle size={11} /> IN
                      </span>
                    ) : (
                      <span className="badge badge-red flex items-center gap-1 w-fit">
                        <ArrowDownCircle size={11} /> OUT
                      </span>
                    )}
                  </td>
                  <td className="font-medium text-slate-200">{t.product}</td>
                  <td className={`font-semibold ${t.type === 'IN' ? 'text-success-500' : 'text-danger-400'}`}>
                    {t.type === 'IN' ? '+' : '-'}{t.qty}
                  </td>
                  <td className="text-slate-400 text-xs">{t.date}</td>
                  <td className="text-slate-400 text-xs">{t.user}</td>
                  <td className="text-slate-500 text-xs max-w-xs truncate">{t.note}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-10">
                    No transactions found
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
