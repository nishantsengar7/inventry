import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { transactionsAPI, productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, toArray } from '../utils/helpers';

const EMPTY_FORM = { product_id: '', type: 'IN', quantity: 1, note: '' };

export default function Transactions() {
  const { isAdmin } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts]         = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [typeFilter, setTypeFilter]     = useState('');
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [stockError, setStockError]     = useState('');

  const selectedProduct = products.find((p) => String(p.id) === String(form.product_id));
  const currentStock    = selectedProduct?.quantity ?? null;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = {};
      if (typeFilter) filters.type       = typeFilter;
      if (startDate)  filters.start_date = new Date(startDate).toISOString();
      if (endDate)    filters.end_date   = new Date(endDate + 'T23:59:59').toISOString();
      const [txns, prods] = await Promise.all([
        transactionsAPI.getAll(filters),
        productsAPI.getAll(),
      ]);
      setTransactions(toArray(txns));
      setProducts(toArray(prods));
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, startDate, endDate]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (form.type === 'OUT' && currentStock !== null && form.quantity > currentStock) {
      setStockError(`⚠️ Insufficient stock — only ${currentStock} units available`);
    } else if (form.quantity < 1) {
      setStockError('Quantity must be at least 1');
    } else {
      setStockError('');
    }
  }, [form.quantity, form.type, currentStock]);

  const columns = [
    { key: 'created_at',  label: 'Date & Time',    render: (v) => <span className="text-gray-600 text-xs">{formatDateTime(v)}</span> },
    { key: 'product_name',label: 'Product',         render: (v) => <span className="font-semibold text-gray-800">{v ?? '—'}</span> },
    { key: 'type',         label: 'Type',            render: (v) => <Badge status={v} /> },
    {
      key: 'quantity', label: 'Quantity',
      render: (v, row) => (
        <span className={`font-bold ${row.type === 'IN' ? 'text-green-600' : 'text-red-500'}`}>
          {row.type === 'IN' ? '+' : '-'}{v}
        </span>
      ),
    },
    { key: 'note', label: 'Note', render: (v) => <span className="text-gray-400 text-sm">{v ?? '—'}</span> },
  ];

  const isFiltered = !!(typeFilter || startDate || endDate);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.product_id) { toast.error('Please select a product'); return; }
    if (form.quantity < 1) { toast.error('Quantity must be at least 1'); return; }
    if (stockError && form.type === 'OUT') {
      toast.error(`Insufficient stock — only ${currentStock} units available`);
      return;
    }
    setSaving(true);
    const tid = toast.loading('Recording transaction…');
    try {
      await transactionsAPI.create({
        product_id: parseInt(form.product_id),
        type:       form.type,
        quantity:   parseInt(form.quantity),
        note:       form.note.trim() || null,
      });
      const qty = parseInt(form.quantity);
      if (form.type === 'IN') {
        toast.success(`Stock IN recorded — +${qty} units added`, { id: tid });
      } else {
        toast.success(`Stock OUT recorded — -${qty} units deducted`, { id: tid });
      }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      const msg = err?.response?.data?.detail ?? '';
      if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('stock')) {
        toast.error(`Insufficient stock — only ${currentStock} units available`, { id: tid });
      } else {
        toast.error('Failed to record transaction', { id: tid });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Transactions">
      <div className="space-y-5">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">Transactions</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              {transactions.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['', 'IN', 'OUT'].map((t) => (
              <button key={t || 'ALL'}
                onClick={() => setTypeFilter(t)}
                className={`py-1.5 px-3 text-sm rounded-lg border font-medium transition-colors ${
                  typeFilter === t
                    ? t === 'IN'  ? 'bg-green-600  text-white border-green-600'
                    : t === 'OUT' ? 'bg-red-600    text-white border-red-600'
                    :               'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t || 'All'}
              </button>
            ))}
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="py-1.5 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="py-1.5 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600" />
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-gray-400 hover:text-gray-600">Clear dates</button>
            )}
            {isAdmin() && (
              <button onClick={() => { setForm(EMPTY_FORM); setStockError(''); setModalOpen(true); }}
                className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus size={16} /> New Transaction
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={transactions}
          isLoading={isLoading}
          emptyIcon={<BarChart3 size={48} className="text-gray-300" />}
          emptyTitle={isFiltered ? 'No transactions found' : 'No transactions yet'}
          emptyMessage={
            isFiltered
              ? 'Try adjusting your date range or type filter'
              : 'Stock movements will appear here once recorded'
          }
          emptyAction={
            !isFiltered && isAdmin() ? (
              <button
                onClick={() => { setForm(EMPTY_FORM); setModalOpen(true); }}
                className="mt-4 flex items-center gap-2 mx-auto py-2.5 px-5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Record First Transaction
              </button>
            ) : null
          }
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Stock Movement" size="sm">
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
            <select
              required value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
              ))}
            </select>
            {selectedProduct && (
              <p className="text-xs text-gray-400 mt-1">
                Current stock: <strong className={currentStock === 0 ? 'text-red-600' : currentStock <= selectedProduct.threshold ? 'text-amber-600' : 'text-gray-700'}>
                  {currentStock} units
                </strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {['IN', 'OUT'].map((t) => (
                <label key={t}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer font-semibold text-sm transition-all ${
                    form.type === t
                      ? t === 'IN'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" value={t} checked={form.type === t}
                    onChange={() => setForm({ ...form, type: t })} className="sr-only" />
                  {t === 'IN' ? '↑ Stock IN' : '↓ Stock OUT'}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number" min="1" required value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                stockError ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-indigo-400'
              }`}
            />
            {stockError && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle size={12} />{stockError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="e.g. Monthly restock from supplier…" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)}
              className="py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || (form.type === 'OUT' && !!stockError)}
              className="py-2 px-4 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Record Transaction
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
