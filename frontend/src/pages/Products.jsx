import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import CategorySuggester from '../components/ai/CategorySuggester';
import { productsAPI, categoriesAPI, suppliersAPI } from '../services/api';
import { toArray } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getStockStatus, generateSKU } from '../utils/helpers';

const EMPTY_FORM = {
  name: '', sku: '', description: '', price: '',
  quantity: 0, threshold: 10, category_id: '', supplier_id: '',
};

const EMPTY_ERRORS = {
  name: '', sku: '', price: '', quantity: '', threshold: '', category_id: '',
};

function validate(form) {
  const errors = { ...EMPTY_ERRORS };
  if (!form.name.trim() || form.name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters';
  if (!form.sku.trim() || form.sku.trim().length < 3)
    errors.sku = 'SKU must be at least 3 characters';
  if (/\s/.test(form.sku))
    errors.sku = 'SKU cannot contain spaces';
  if (!form.price || parseFloat(form.price) <= 0)
    errors.price = 'Price must be greater than 0';
  if (form.quantity === '' || parseInt(form.quantity) < 0)
    errors.quantity = 'Quantity must be 0 or more';
  if (!form.threshold || parseInt(form.threshold) < 1)
    errors.threshold = 'Threshold must be at least 1';
  return errors;
}

function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}

export default function Products() {
  const { isAdmin } = useAuth();
  const searchTimer = useRef(null);

  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter]   = useState('');
  const [lowStockOnly, setLowStockOnly]       = useState(false);

  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [errors, setErrors]             = useState(EMPTY_ERRORS);
  const [touched, setTouched]           = useState({});
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, cats, sups] = await Promise.all([
        productsAPI.getAll({ search: debouncedSearch, category_id: categoryFilter || undefined, low_stock: lowStockOnly || undefined }),
        categoriesAPI.getAll(),
        suppliersAPI.getAll(),
      ]);
      setProducts(toArray(prods));
      setCategories(toArray(cats));
      setSuppliers(toArray(sups));
    } catch {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, categoryFilter, lowStockOnly]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validate(form));
    }
  }, [form, touched]);

  const columns = [
    {
      key: 'sku', label: 'SKU',
      render: (v) => <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{v}</span>,
    },
    { key: 'name', label: 'Name', render: (v) => <span className="font-semibold text-gray-800">{v}</span> },
    { key: 'category_name', label: 'Category', render: (v) => v ? <Badge status="viewer">{v}</Badge> : '—' },
    { key: 'supplier_name', label: 'Supplier', render: (v) => v ?? '—' },
    { key: 'price',    label: 'Price',    render: (v) => formatCurrency(v) },
    {
      key: 'quantity', label: 'Qty',
      render: (v, row) => (
        <span className={v <= row.threshold ? 'text-red-600 font-bold' : 'text-gray-700 font-medium'}>
          {v}
        </span>
      ),
    },
    {
      key: 'quantity', label: 'Status',
      render: (v, row) => <Badge status={getStockStatus(v, row.threshold)} />,
    },
  ];

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, sku: generateSKU() });
    setErrors(EMPTY_ERRORS);
    setTouched({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setForm({
      name: row.name, sku: row.sku, description: row.description ?? '',
      price: row.price, quantity: row.quantity, threshold: row.threshold,
      category_id: row.category_id ?? '', supplier_id: row.supplier_id ?? '',
    });
    setErrors(EMPTY_ERRORS);
    setTouched({});
    setModalOpen(true);
  };

  const handleFieldChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const allTouched = Object.keys(EMPTY_ERRORS).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setSaving(true);
    const tid = toast.loading(editTarget ? 'Updating product…' : 'Creating product…');
    try {
      const payload = {
        ...form,
        name:        form.name.trim(),
        sku:         form.sku.trim().toUpperCase(),
        description: form.description.trim(),
        price:       parseFloat(form.price),
        quantity:    parseInt(form.quantity),
        threshold:   parseInt(form.threshold),
        category_id: form.category_id ? parseInt(form.category_id) : null,
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
      };
      if (editTarget) {
        await productsAPI.update(editTarget.id, payload);
        toast.success('Product updated successfully', { id: tid });
      } else {
        await productsAPI.create(payload);
        toast.success('Product created successfully', { id: tid });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      const msg = err?.response?.data?.detail ?? '';
      if (msg.toLowerCase().includes('sku') || msg.toLowerCase().includes('unique')) {
        toast.error('SKU already exists — choose a different one', { id: tid });
      } else {
        toast.error(editTarget ? 'Failed to update product' : 'Failed to create product', { id: tid });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    const tid = toast.loading('Deleting product…');
    try {
      await productsAPI.delete(deleteTarget.id);
      toast.success('Product deleted successfully', { id: tid });
      setDeleteTarget(null);
    } catch {

      loadData();
      toast.error('Failed to delete product', { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  const lowCount = products.filter((p) => p.quantity <= p.threshold).length;
  const isFiltered = !!debouncedSearch || !!categoryFilter || lowStockOnly;

  const inputCls = (field) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field] && touched[field]
        ? 'border-red-400 focus:ring-red-300 bg-red-50'
        : 'border-gray-200 focus:ring-indigo-400'
    }`;

  const ErrorMsg = ({ field }) =>
    errors[field] && touched[field]
      ? <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
      : null;

  return (
    <Layout title="Products" lowStockCount={lowCount}>
      <div className="space-y-5">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">Products</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              {products.length}
            </span>
            {debouncedSearch !== search && (
              <span className="text-xs text-gray-400 italic">Searching…</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Search name or SKU…" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 text-sm border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={() => setLowStockOnly((v) => !v)}
              className={`py-2 px-3 text-sm rounded-lg border font-medium transition-colors ${
                lowStockOnly
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {lowStockOnly ? '⚠ Low Stock' : 'All Stock'}
            </button>
            {isAdmin() && (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white
                           text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Add Product
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          onEdit={isAdmin() ? openEdit : undefined}
          onDelete={isAdmin() ? (row) => setDeleteTarget(row) : undefined}
          emptyIcon={<Package size={48} className="text-gray-300" />}
          emptyTitle={isFiltered ? 'No products found' : 'No products yet'}
          emptyMessage={
            isFiltered
              ? 'Try adjusting your search or filters'
              : 'Add your first product to get started'
          }
          emptyAction={
            !isFiltered && isAdmin() ? (
              <button
                onClick={openAdd}
                className="mt-4 flex items-center gap-2 mx-auto py-2.5 px-5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Add First Product
              </button>
            ) : null
          }
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className={inputCls('name')}
                placeholder="e.g. Wireless Keyboard"
              />
              <ErrorMsg field="name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input
                value={form.sku}
                onChange={(e) => handleFieldChange('sku', e.target.value)}
                className={inputCls('sku') + ' font-mono'}
                placeholder="e.g. ELEC-001"
              />
              <ErrorMsg field="sku" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2} value={form.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Product description…"
            />
            <CategorySuggester
              productName={form.name}
              description={form.description}
              onCategorySelect={(catName) => {
                const cat = categories.find(c => c.name === catName);
                if (cat) handleFieldChange('category_id', cat.id);
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number" step="0.01" min="0.01" value={form.price}
                onChange={(e) => handleFieldChange('price', e.target.value)}
                className={inputCls('price')}
                placeholder="0.00"
              />
              <ErrorMsg field="price" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number" min="0" value={form.quantity}
                onChange={(e) => handleFieldChange('quantity', e.target.value)}
                className={inputCls('quantity')}
              />
              <ErrorMsg field="quantity" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <input
                type="number" min="1" value={form.threshold}
                onChange={(e) => handleFieldChange('threshold', e.target.value)}
                className={inputCls('threshold')}
              />
              <ErrorMsg field="threshold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => handleFieldChange('category_id', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                value={form.supplier_id}
                onChange={(e) => handleFieldChange('supplier_id', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">No supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)}
              className="py-2.5 px-5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || (Object.keys(touched).length > 0 && hasErrors(errors))}
              className="py-2.5 px-5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editTarget ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all its transactions.`}
      />
    </Layout>
  );
}
