import { useState, useEffect, useCallback } from 'react';
import { Plus, Mail, Phone, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchBar from '../components/ui/SearchBar';
import { suppliersAPI, productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, toArray } from '../utils/helpers';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d\s\-().]{7,20}$/;

function validate(form) {
  const errors = { name: '', email: '', phone: '' };
  if (!form.name.trim() || form.name.trim().length < 2)
    errors.name = 'Supplier name must be at least 2 characters';
  if (form.email && !EMAIL_RE.test(form.email))
    errors.email = 'Enter a valid email address';
  if (form.phone && !PHONE_RE.test(form.phone))
    errors.phone = 'Enter a valid phone number';
  return errors;
}

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers]         = useState([]);
  const [filtered, setFiltered]           = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [isLoading, setIsLoading]         = useState(true);
  const [search, setSearch]               = useState('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [errors, setErrors]               = useState({ name: '', email: '', phone: '' });
  const [touched, setTouched]             = useState({});
  const [saving, setSaving]               = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleting, setDeleting]           = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sups, prods] = await Promise.all([suppliersAPI.getAll(), productsAPI.getAll()]);
      setSuppliers(toArray(sups));
      const counts = {};
      toArray(prods).forEach((p) => {
        if (p.supplier_id) counts[p.supplier_id] = (counts[p.supplier_id] || 0) + 1;
      });
      setProductCounts(counts);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)) : suppliers,
    );
  }, [search, suppliers]);

  useEffect(() => {
    if (Object.keys(touched).length > 0) setErrors(validate(form));
  }, [form, touched]);

  const columns = [
    { key: 'name',  label: 'Name',  render: (v) => <span className="font-semibold text-gray-800">{v}</span> },
    {
      key: 'email', label: 'Email',
      render: (v) => v ? (
        <a href={`mailto:${v}`} className="flex items-center gap-1 text-indigo-600 hover:underline text-sm">
          <Mail size={12} />{v}
        </a>
      ) : '—',
    },
    {
      key: 'phone', label: 'Phone',
      render: (v) => v ? (
        <span className="flex items-center gap-1 text-sm"><Phone size={12} className="text-gray-400" />{v}</span>
      ) : '—',
    },
    { key: 'address',    label: 'Address',  render: (v) => v ?? '—' },
    { key: 'id',         label: 'Products', render: (v) => <span className="font-semibold text-indigo-600">{productCounts[v] ?? 0}</span> },
    { key: 'created_at', label: 'Since',    render: (v) => formatDate(v) },
  ];

  const openAdd  = () => { setEditTarget(null); setForm(EMPTY_FORM); setErrors({ name: '', email: '', phone: '' }); setTouched({}); setModalOpen(true); };
  const openEdit = (row) => {
    setEditTarget(row);
    setForm({ name: row.name, email: row.email ?? '', phone: row.phone ?? '', address: row.address ?? '' });
    setErrors({ name: '', email: '', phone: '' });
    setTouched({});
    setModalOpen(true);
  };

  const handleField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const allTouched = { name: true, email: true, phone: true };
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setSaving(true);
    const tid = toast.loading(editTarget ? 'Updating…' : 'Creating…');
    try {
      const payload = {
        name:    form.name.trim(),
        email:   form.email.trim() || null,
        phone:   form.phone.trim() || null,
        address: form.address.trim() || null,
      };
      if (editTarget) {
        await suppliersAPI.update(editTarget.id, payload);
        toast.success('Supplier updated successfully', { id: tid });
      } else {
        await suppliersAPI.create(payload);
        toast.success('Supplier added successfully', { id: tid });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save supplier', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleting(true);
    const tid = toast.loading('Deleting…');
    try {
      await suppliersAPI.delete(deleteTarget.id);
      toast.success('Supplier deleted successfully', { id: tid });
      setDeleteTarget(null);
    } catch {
      loadData();
      toast.error('Failed to delete supplier', { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  const inputCls = (field) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field] && touched[field]
        ? 'border-red-400 focus:ring-red-300 bg-red-50'
        : 'border-gray-200 focus:ring-indigo-400'
    }`;
  const ErrMsg = ({ f }) => errors[f] && touched[f] ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p> : null;

  return (
    <Layout title="Suppliers">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">Suppliers</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              {suppliers.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Search suppliers…" />
            {isAdmin() && (
              <button onClick={openAdd}
                className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus size={16} /> Add Supplier
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          onEdit={isAdmin() ? openEdit : undefined}
          onDelete={isAdmin() ? (row) => setDeleteTarget(row) : undefined}
          emptyIcon={<Truck size={48} className="text-gray-300" />}
          emptyTitle={search ? 'No suppliers found' : 'No suppliers yet'}
          emptyMessage={search ? 'Try a different search term' : 'Add your first supplier to track stock sources'}
          emptyAction={
            !search && isAdmin() ? (
              <button
                onClick={openAdd}
                className="mt-4 flex items-center gap-2 mx-auto py-2.5 px-5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Add First Supplier
              </button>
            ) : null
          }
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Supplier' : 'Add Supplier'} size="md">
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
            <input value={form.name} onChange={(e) => handleField('name', e.target.value)}
              className={inputCls('name')} placeholder="e.g. TechCorp" />
            <ErrMsg f="name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => handleField('email', e.target.value)}
                className={inputCls('email')} placeholder="contact@supplier.com" />
              <ErrMsg f="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => handleField('phone', e.target.value)}
                className={inputCls('phone')} placeholder="+91-98765-43210" />
              <ErrMsg f="phone" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Street, City, State, PIN" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)}
              className="py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="py-2 px-4 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editTarget ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Supplier"
        message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </Layout>
  );
}
