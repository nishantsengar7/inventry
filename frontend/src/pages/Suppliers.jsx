import { useState } from 'react'
import { Plus, Search, Truck, Pencil, Trash2, Globe, Mail, Phone } from 'lucide-react'

const MOCK_SUPPLIERS = [
  { id: 1, name: 'TechCorp Ltd.',     contact: 'John Doe',   email: 'john@techcorp.com',   phone: '+1 555-0101', country: 'USA',    active: true  },
  { id: 2, name: 'Global Parts Inc.', contact: 'Sara Lee',   email: 'sara@globalparts.com', phone: '+44 20-7946', country: 'UK',     active: true  },
  { id: 3, name: 'EuroSupply GmbH',   contact: 'Hans Müller',email: 'hans@eurosupply.de',   phone: '+49 30-1234', country: 'Germany',active: false },
  { id: 4, name: 'Asia Trade Co.',    contact: 'Li Wei',     email: 'li@asiatrade.cn',      phone: '+86 10-5678', country: 'China',  active: true  },
]

export default function Suppliers() {
  const [suppliers] = useState(MOCK_SUPPLIERS)
  const [search, setSearch] = useState('')

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage your supply chain partners</p>
        </div>
        <button id="add-supplier-btn" className="btn-primary">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="supplier-search"
            type="text"
            placeholder="Search suppliers…"
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
                <th>Supplier</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-900/50 flex items-center justify-center">
                        <Truck size={14} className="text-primary-400" />
                      </div>
                      <span className="font-medium text-slate-200">{s.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-400">{s.contact}</td>
                  <td>
                    <a href={`mailto:${s.email}`} className="text-primary-400 hover:underline flex items-center gap-1">
                      <Mail size={12} /> {s.email}
                    </a>
                  </td>
                  <td className="text-slate-400 text-xs">{s.phone}</td>
                  <td className="text-slate-400">{s.country}</td>
                  <td>
                    <span className={`badge ${s.active ? 'badge-green' : 'badge-gray'}`}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost p-1.5 rounded-md"><Pencil size={14} /></button>
                      <button className="btn-ghost p-1.5 rounded-md text-danger-400 hover:bg-danger-900/20"><Trash2 size={14} /></button>
                    </div>
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
