import { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, Eye, Trash2, Plus, ShoppingBag, 
  AlertTriangle, Mail, Phone, Calendar, Clipboard, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';
import FormInput from '../components/ui/FormInput';
import { useFormValidation } from '../hooks/useFormValidation';
import { rules } from '../utils/validationRules';
import { ordersAPI, customersAPI, productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  formatCurrency, formatDateTime, toArray, 
  formatOrderId, getOrderStatusColor 
} from '../utils/helpers';

const EMPTY_FORM = {
  customer_id: '',
  notes: ''
};

const orderValidationRules = {
  customer_id: [
    rules.required("Customer selection is required")
  ],
  notes: [
    rules.maxLength(500, "Notes cannot exceed 500 characters")
  ]
};

export default function Orders() {
  const { isAdmin } = useAuth();

  // State variables
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all/pending/completed/cancelled
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Create Form State
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [formItems, setFormItems] = useState([{ product_id: '', quantity: 1, max_qty: 0, price: 0, subtotal: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemErrors, setItemErrors] = useState({});

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setFieldError,
    setValues
  } = useFormValidation(EMPTY_FORM, orderValidationRules);

  const setItemError = (productId, message) => {
    setItemErrors(prev => ({ ...prev, [productId]: message }));
  };

  const clearErrors = () => {
    setItemErrors({});
  };

  // Load orders, customers, products
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ordersAPI.getAll({ limit: 1000 });
      setOrders(toArray(data?.orders));
      setTotalCount(data?.total ?? 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load customer and product lists when opening create modal
  const handleOpenCreateModal = async () => {
    if (!isAdmin()) return;
    try {
      const [custs, prods] = await Promise.all([
        customersAPI.getAll({ limit: 500 }),
        productsAPI.getAll()
      ]);
      setCustomers(toArray(custs?.customers ?? custs));
      setProducts(toArray(prods));
      
      reset();
      setCustomerSearch('');
      setFormItems([{ product_id: '', quantity: 1, max_qty: 0, price: 0, subtotal: 0 }]);
      clearErrors();
      setIsCreateModalOpen(true);
    } catch {
      toast.error('Failed to initialize new order form');
    }
  };

  const handleOpenDetailModal = async (orderListItem) => {
    setIsLoading(true);
    try {
      const orderDetails = await ordersAPI.getById(orderListItem.id);
      setSelectedOrder(orderDetails);
      setIsDetailModalOpen(true);
    } catch {
      toast.error('Failed to fetch order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeleteModal = (order) => {
    if (!isAdmin()) return;
    if (order.status === 'completed') {
      toast.error('Completed orders cannot be deleted or cancelled.');
      return;
    }
    setSelectedOrder(order);
    setIsDeleteDialogOpen(true);
  };

  // Status Counts
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const allCount = orders.length;

  const displayedOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  // Product Selection Handlers
  const handleProductChange = (index, prodId) => {
    const newItems = [...formItems];
    const prod = products.find(p => String(p.id) === String(prodId));
    if (prod) {
      newItems[index].product_id = prodId;
      newItems[index].price = prod.price;
      newItems[index].max_qty = prod.quantity;
      newItems[index].quantity = prod.quantity > 0 ? 1 : 0;
      newItems[index].subtotal = newItems[index].quantity * prod.price;
    } else {
      newItems[index].product_id = '';
      newItems[index].price = 0;
      newItems[index].max_qty = 0;
      newItems[index].quantity = 1;
      newItems[index].subtotal = 0;
    }
    setFormItems(newItems);
    
    // Clear item error for this product
    if (prodId) {
      setItemErrors(prev => {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      });
    }
  };

  const handleQuantityChange = (index, qty) => {
    const newItems = [...formItems];
    const val = parseInt(qty);
    newItems[index].quantity = isNaN(val) ? 0 : val;
    newItems[index].subtotal = newItems[index].quantity * newItems[index].price;
    setFormItems(newItems);

    // Clear item error for this product when quantity changes
    const prodId = newItems[index].product_id;
    if (prodId) {
      setItemErrors(prev => {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      });
    }
  };

  const addRow = () => {
    if (formItems.length >= 10) {
      toast.error('Maximum 10 items per order');
      return;
    }
    setFormItems([...formItems, { product_id: '', quantity: 1, max_qty: 0, price: 0, subtotal: 0 }]);
  };

  const removeRow = (index) => {
    if (formItems.length <= 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // Live total sum
  const orderTotalAmount = formItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Search filter for customers
  const filteredCustomers = customers.filter(c => 
    c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = customers.find(c => String(c.id) === String(values.customer_id));

  // Form Validation
  const hasDuplicateProducts = () => {
    const ids = formItems.map(item => item.product_id).filter(Boolean);
    return ids.length !== new Set(ids).size;
  };

  const isFormInvalid = () => {
    if (!values.customer_id) return true;
    if (formItems.length === 0) return true;
    if (hasDuplicateProducts()) return true;
    if (errors.notes) return true;
    
    return formItems.some(item => 
      !item.product_id || 
      item.quantity < 1 || 
      item.quantity > item.max_qty
    );
  };

  // Submit Handler
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!isAdmin()) {
      toast.error('Only admins can create orders');
      return;
    }

    const isMetaValid = validate();
    if (!isMetaValid) return;

    if (isFormInvalid()) {
      if (hasDuplicateProducts()) {
        toast.error('Duplicate products in order. Combine quantities instead.');
      } else {
        toast.error('Please fix validation errors in items before submitting.');
      }
      return;
    }

    setIsSubmitting(true);
    clearErrors();
    const toastId = toast.loading('Creating order…');

    try {
      const payload = {
        customer_id: parseInt(values.customer_id),
        items: formItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: item.quantity
        })),
        notes: values.notes?.trim() || null
      };

      const newOrder = await ordersAPI.create(payload);
      toast.success(`Order #${newOrder.id} created! Stock updated automatically.`, { id: toastId });
      setIsCreateModalOpen(false);
      loadData();
    } catch (error) {
      toast.dismiss(toastId);
      if (error.stockErrors) {
        // Show inline errors on each item row
        error.stockErrors.forEach(stockErr => {
          setItemError(
            stockErr.product_id,
            `Only ${stockErr.available} available`
          );
        });
        toast.error('Some items have insufficient stock. See errors below.');
      } else {
        toast.error(error.userMessage || 'Failed to create order');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel order (from details modal or row action)
  const handleUpdateStatus = async (id, status) => {
    if (!isAdmin()) {
      toast.error('Only admins can update order status');
      return;
    }
    
    // Safety check
    const orderToUpdate = orders.find(o => o.id === id);
    if (orderToUpdate && orderToUpdate.status === 'completed' && status === 'cancelled') {
      toast.error('Completed orders cannot be cancelled.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Updating order status to ${status}…`);
    try {
      const updated = await ordersAPI.updateStatus(id, status);
      toast.success(`Order ${formatOrderId(updated.id)} marked as ${status}.`, { id: toastId });
      setIsDetailModalOpen(false);
      loadData();
    } catch (err) {
      const responseErr = err?.response?.data;
      const errorMsg = responseErr?.message || responseErr?.detail?.message || responseErr?.detail || 'Failed to update status';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete/Cancel Order Handler
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    if (!isAdmin()) {
      toast.error('Only admins can cancel orders');
      return;
    }
    if (selectedOrder.status === 'completed') {
      toast.error('Completed orders cannot be deleted or cancelled.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Cancelling Order ${formatOrderId(selectedOrder.id)}…`);
    try {
      await ordersAPI.delete(selectedOrder.id);
      toast.success('Order cancelled. Stock has been restored.', { id: toastId });
      setIsDeleteDialogOpen(false);
      setSelectedOrder(null);
      loadData();
    } catch (err) {
      const responseErr = err?.response?.data;
      const errorMsg = responseErr?.message || responseErr?.detail?.message || responseErr?.detail || 'Failed to cancel order';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Columns for main Orders Table
  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (v) => (
        <span className="font-mono text-gray-500 font-semibold">{formatOrderId(v)}</span>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
            {row.customer_name?.[0] ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{row.customer_name ?? 'Unknown Customer'}</p>
            {row.customer_email && <p className="text-xs text-gray-400 font-normal lowercase">{row.customer_email}</p>}
          </div>
        </div>
      )
    },
    {
      key: 'first_product_name',
      label: 'Items',
      render: (_, row) => (
        <div className="text-sm">
          <span className="font-semibold text-gray-700">{row.item_count} item(s)</span>
          {row.first_product_name && (
            <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">
              {row.first_product_name}
              {row.more_items_count > 0 && ` +${row.more_items_count} more`}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'total_amount',
      label: 'Total Amount',
      render: (v) => (
        <span className="font-bold text-gray-900">{formatCurrency(v)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <Badge status={v} />
      )
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (v) => (
        <span className="text-xs text-gray-500 font-medium">{formatDateTime(v)}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {/* View details */}
          <button
            onClick={() => handleOpenDetailModal(row)}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          
          {/* Admin status update dropdown */}
          {isAdmin() && row.status === 'pending' && (
            <select
              value={row.status}
              onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
              className="py-1 px-2 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
            >
              <option value="pending" disabled>Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}

          {/* Admin cancel (delete) */}
          {isAdmin() && (
            <button
              onClick={() => handleOpenDeleteModal(row)}
              disabled={row.status === 'completed'}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Cancel & Delete Order"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <Layout title="Orders">
      <div className="space-y-5">
        
        {/* Header section */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">Orders</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              {displayedOrders.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin() && (
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus size={16} /> New Order
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {[
              { id: 'all', label: 'All', count: allCount },
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'completed', label: 'Completed', count: completedCount },
              { id: 'cancelled', label: 'Cancelled', count: cancelledCount }
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all relative ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label} <span className="text-xs font-normal opacity-85">({tab.count})</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Orders List Table */}
        <DataTable
          columns={columns}
          data={displayedOrders}
          isLoading={isLoading}
          emptyIcon={<ShoppingBag size={48} className="text-gray-300" />}
          emptyTitle={statusFilter !== 'all' ? `No ${statusFilter} orders found` : 'No orders found'}
          emptyMessage={statusFilter !== 'all' ? `There are no orders with status: ${statusFilter}` : 'Create your first order'}
          emptyAction={
            statusFilter === 'all' && isAdmin() ? (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 flex items-center gap-2 mx-auto py-2.5 px-5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Create First Order
              </button>
            ) : null
          }
        />
      </div>

      {/* CREATE ORDER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Order"
        size="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-6" noValidate>
          
          {/* SECTION 1: CUSTOMER SELECTION */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-left">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <User size={16} className="text-indigo-600" />
              1. Customer Selection
            </h3>
            
            {!values.customer_id ? (
              <div className="relative">
                <FormInput
                  label="Select Customer"
                  name="customerSearch"
                  value={customerSearch}
                  onChange={(_, val) => setCustomerSearch(val)}
                  onBlur={handleBlur}
                  placeholder="Search customer by name or email..."
                  required={true}
                  error={errors.customer_id}
                  touched={touched.customer_id}
                />
                {customerSearch && filteredCustomers.length > 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          setValues(prev => ({ ...prev, customer_id: String(cust.id) }));
                          setCustomerSearch('');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {cust.full_name?.[0] ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{cust.full_name}</p>
                          <p className="text-xs text-gray-400">{cust.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {customerSearch && filteredCustomers.length === 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-sm text-gray-400">
                    No customers found matching "{customerSearch}"
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase">
                    {selectedCustomer?.full_name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{selectedCustomer?.full_name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Mail size={12} className="text-gray-400" />
                      {selectedCustomer?.email}
                    </p>
                    {selectedCustomer?.phone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={12} className="text-gray-400" />
                        {selectedCustomer?.phone}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setValues(prev => ({ ...prev, customer_id: '' }))}
                  className="text-xs font-semibold bg-white px-3 py-1.5 border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
            
            {errors.customer_id && touched.customer_id && !values.customer_id && (
              <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                <span>⚠</span> {errors.customer_id}
              </p>
            )}
          </div>

          {/* SECTION 2: ORDER ITEMS */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-left">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <ShoppingCart size={16} className="text-indigo-600" />
              2. Order Items
            </h3>

            <div className="space-y-4">
              {formItems.map((item, index) => {
                const prod = products.find(p => String(p.id) === String(item.product_id));
                const isLowStock = prod ? prod.quantity <= prod.threshold : false;
                const showWarning = item.product_id && item.quantity > item.max_qty;

                return (
                  <div key={index} className="flex flex-wrap md:flex-nowrap items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    
                    {/* Product Dropdown */}
                    <div className="flex-1 min-w-[200px] flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Product <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={item.product_id}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white ${
                          isLowStock && item.product_id ? 'text-red-600 font-semibold' : 'text-gray-800'
                        } border-gray-300 focus:ring-indigo-200 focus:border-indigo-400`}
                      >
                        <option value="">Select Product...</option>
                        {products.map(p => {
                          const isLow = p.quantity <= p.threshold;
                          return (
                            <option 
                              key={p.id} 
                              value={p.id}
                              disabled={p.quantity <= 0}
                              className={isLow ? 'text-red-500 font-semibold' : 'text-gray-700'}
                            >
                              {p.name} ({p.sku}) | Stock: {p.quantity} {isLow ? ' [LOW STOCK]' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {isLowStock && item.product_id && (
                        <p className="text-amber-600 text-xs mt-1 flex items-center gap-1 font-medium">
                          <span>⚠</span> Low stock warning: Only {item.max_qty} remaining.
                        </p>
                      )}
                    </div>

                    {/* Quantity input using FormInput */}
                    <div className="w-28">
                      <FormInput
                        label="Quantity"
                        name={`quantity-${index}`}
                        type="number"
                        value={item.quantity}
                        onChange={(_, val) => handleQuantityChange(index, val)}
                        error={
                          itemErrors[item.product_id] || 
                          (showWarning ? `Only ${item.max_qty} available` : null)
                        }
                        touched={!!item.product_id}
                        min="1"
                        max={item.max_qty}
                        required={true}
                        disabled={!item.product_id}
                      />
                    </div>

                    {/* Price and Subtotal displays */}
                    <div className="w-32 flex flex-col justify-end text-right self-center pt-5">
                      <span className="text-xs text-gray-400 font-medium">{formatCurrency(item.price)} each</span>
                      <span className="text-sm font-bold text-gray-800">{formatCurrency(item.subtotal)}</span>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={formItems.length <= 1}
                      className="p-2 text-red-500 hover:bg-red-50 disabled:opacity-30 rounded-lg transition-colors self-center mt-5"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>

            {hasDuplicateProducts() && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                <AlertTriangle size={12} /> Duplicate products selected. Please combine quantities or change selections.
              </p>
            )}

            <button
              type="button"
              onClick={addRow}
              disabled={formItems.length >= 10}
              className="flex items-center gap-1.5 py-1.5 px-3 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 text-xs font-semibold transition-colors disabled:opacity-40"
            >
              <Plus size={14} /> Add Another Item
            </button>
          </div>

          {/* SECTION 3: ORDER SUMMARY */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60 space-y-3 text-left">
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Order Summary</h4>
            <div className="divide-y divide-indigo-100 max-h-40 overflow-y-auto">
              {formItems.map((item, idx) => {
                const prod = products.find(p => String(p.id) === String(item.product_id));
                if (!prod) return null;
                return (
                  <div key={idx} className="flex justify-between py-2 text-sm text-gray-700">
                    <span>Item {idx + 1}: {prod.name} × {item.quantity}</span>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-indigo-200/80 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-indigo-900">Total Amount:</span>
              <span className="text-lg font-extrabold text-indigo-900">{formatCurrency(orderTotalAmount)}</span>
            </div>
          </div>

          {/* SECTION 4: NOTES */}
          <div className="text-left">
            <FormInput
              label="Notes"
              name="notes"
              value={values.notes}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.notes}
              touched={touched.notes}
              placeholder="Add order notes (shipping instructions, requirements, etc.)..."
              optional={true}
              hint={`Characters: ${values.notes?.length ?? 0}/500`}
            />
          </div>

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isFormInvalid()}
              className="py-2.5 px-5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2 transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingCart size={16} />
              )}
              Create Order
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedOrder ? `Order ${formatOrderId(selectedOrder.id)} Details` : 'Order Details'}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6 text-left">
            
            {/* Top section info */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-xl font-bold text-gray-900">Order {formatOrderId(selectedOrder.id)}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
                  <Calendar size={12} />
                  <span>Created: {formatDateTime(selectedOrder.created_at)}</span>
                </div>
              </div>
              <Badge status={selectedOrder.status} />
            </div>

            {/* Two columns: Customer & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Customer Card */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <User size={14} /> Customer Information
                </h4>
                <p className="font-bold text-gray-800 text-base">{selectedOrder.customer_name ?? 'Deleted Customer'}</p>
                <div className="text-sm text-gray-600 space-y-1 mt-2 font-medium">
                  {selectedOrder.customer_email && (
                    <p className="flex items-center gap-1.5 text-xs lowercase">
                      <Mail size={14} className="text-gray-400" />
                      {selectedOrder.customer_email}
                    </p>
                  )}
                  {selectedOrder.customer_id && !selectedOrder.customer_email && (
                    <p className="text-xs text-amber-600">Customer account deleted</p>
                  )}
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clipboard size={14} /> Order Summary
                </h4>
                <div className="text-sm text-gray-700 space-y-1.5 font-medium">
                  <p className="flex justify-between">
                    <span className="text-gray-500">Total Items:</span>
                    <span className="font-bold">{selectedOrder.item_count} units</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-extrabold text-gray-900">{formatCurrency(selectedOrder.total_amount)}</span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <span className="capitalize font-bold" style={{ color: getOrderStatusColor(selectedOrder.status) === 'amber' ? '#D97706' : getOrderStatusColor(selectedOrder.status) === 'green' ? '#059669' : '#DC2626' }}>
                      {selectedOrder.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-2.5">Order Items</h4>
              <div className="overflow-hidden border border-gray-100 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase">
                      <th className="p-3">Product</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-3">
                          <p className="font-bold text-gray-800">{item.product_name ?? 'Deleted Product'}</p>
                          {item.product_sku && <span className="font-mono text-xs text-gray-400">{item.product_sku}</span>}
                        </td>
                        <td className="p-3 text-center text-gray-700">{item.quantity}</td>
                        <td className="p-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-right text-gray-950 font-bold">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                    <tr className="bg-indigo-50/30 font-bold border-t border-indigo-100">
                      <td colSpan="3" className="p-3 text-right text-indigo-900">Total</td>
                      <td className="p-3 text-right text-lg text-indigo-900 font-extrabold">{formatCurrency(selectedOrder.total_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes Section */}
            {selectedOrder.notes && (
              <div className="p-4 bg-amber-50/40 border border-amber-100/50 rounded-xl">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  📝 Order Notes
                </h4>
                <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Admin actions at bottom */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div>
                {isAdmin() && selectedOrder.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                      className="py-2 px-4 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      Mark Completed ✓
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                      className="py-2 px-4 border border-red-500 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                    >
                      Cancel Order ✗
                    </button>
                  </div>
                )}
                {isAdmin() && selectedOrder.status === 'completed' && (
                  <button disabled className="py-2 px-4 bg-green-100 text-green-700 border border-green-200 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-not-allowed">
                    Completed ✓
                  </button>
                )}
                {isAdmin() && selectedOrder.status === 'cancelled' && (
                  <button disabled className="py-2 px-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-not-allowed">
                    Cancelled ✗
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Close
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* CANCEL & DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteOrder}
        isLoading={isSubmitting}
        title="Cancel Order"
        message={selectedOrder ? `Are you sure you want to cancel Order ${formatOrderId(selectedOrder.id)}? The reserved stock will be automatically restored to inventory.` : ''}
        confirmText="Cancel Order"
        cancelText="Keep Order"
        type="warning"
      />
    </Layout>
  );
}
