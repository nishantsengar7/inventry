import { useState, useEffect, useCallback } from 'react';
import { Plus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { categoriesAPI, productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, toArray } from '../utils/helpers';

const EMPTY_FORM = { name: '', description: '' };

export default function Categories() {
  const { isAdmin } = useAuth();
  const [categories, setCategories]     = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [isLoading, setIsLoading]       = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [nameError, setNameError]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        categoriesAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setCategories(toArray(cats));
      const counts = {};
      toArray(prods).forEach((p) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });
      setProductCounts(counts);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const columns = [
    { key: 'name',        label: 'Name',        render: (v) => <span className="font-semibold text-gray-800">{v}</span> },
    { key: 'description', label: 'Description', render: (v) => v ?? <span className="text-gray-400">—</span> },
    {
      key: 'id', label: 'Products',
      render: (v) => (
        <span className="font-semibold text-indigo-600">{productCounts[v] ?? 0}</span>
      ),
    },
    { key: 'created_at', label: 'Created', render: (v) => formatDate(v) },
  ];

  const openAdd  = () => { setEditTarget(null); setForm(EMPTY_FORM); setNameError(''); setModalOpen(true); };
  const openEdit = (row) => {
    setEditTarget(row);
    setForm({ name: row.name, description: row.description ?? '' });
    setNameError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Category name is required');
      return;
    }
    if (form.name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setNameError('');
    setSaving(true);
    const tid = toast.loading(editTarget ? 'Updating…' : 'Creating…');
    try {
      if (editTarget) {
        await categoriesAPI.update(editTarget.id, { name: form.name.trim(), description: form.description.trim() });
        toast.success('Category updated successfully', { id: tid });
      } else {
        await categoriesAPI.create({ name: form.name.trim(), description: form.description.trim() });
        toast.success('Category created successfully', { id: tid });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save category', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const count = productCounts[deleteTarget.id] ?? 0;
    if (count > 0) {
      toast.error(`⚠️ Cannot delete: category has ${count} product${count > 1 ? 's' : ''}`);
      setDeleteTarget(null);
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleting(true);
    const tid = toast.loading('Deleting…');
    try {
      await categoriesAPI.delete(deleteTarget.id);
      toast.success('Category deleted', { id: tid });
      setDeleteTarget(null);
    } catch {
      loadData();
      toast.error('Failed to delete category', { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout title="Categories">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">Categories</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              {categories.length}
            </span>
          </div>
          {isAdmin() && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          onEdit={isAdmin() ? openEdit : undefined}
          onDelete={isAdmin() ? (row) => setDeleteTarget(row) : undefined}
          emptyIcon={<Tag size={48} className="text-gray-300" />}
          emptyTitle="No categories yet"
          emptyMessage="Categories help you organise your inventory"
          emptyAction={
            isAdmin() ? (
              <button
                onClick={openAdd}
                className="mt-4 flex items-center gap-2 mx-auto py-2.5 px-5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Create First Category
              </button>
            ) : null
          }
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setNameError(''); }}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                nameError ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-200 focus:ring-indigo-400'
              }`}
              placeholder="e.g. Electronics"
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Optional description…"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)}
              className="py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="py-2 px-4 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editTarget ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </Layout>
  );
}
