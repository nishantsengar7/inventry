import { useState, useEffect, useCallback } from 'react';
import { Mail, Phone, Users, UserPlus, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import SearchBar from '../components/ui/SearchBar';
import FormInput from '../components/ui/FormInput';
import { useFormValidation } from '../hooks/useFormValidation';
import { rules } from '../utils/validationRules';
import { customersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, toArray } from '../utils/helpers';

const EMPTY_FORM = { full_name: '', email: '', phone: '' };

const customerValidationRules = {
  full_name: [
    rules.required("Full name is required"),
    rules.minLength(2, "Name must be at least 2 characters"),
    rules.maxLength(150, "Name must be under 150 characters")
  ],
  email: [
    rules.required("Email is required"),
    rules.email("Enter a valid email address")
  ],
  phone: [
    rules.phone("Enter a valid phone number")
  ]
};

export default function Customers() {
  const { isAdmin } = useAuth();
  
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  } = useFormValidation(EMPTY_FORM, customerValidationRules);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadData = useCallback(async (searchVal) => {
    setIsLoading(true);
    try {
      const data = await customersAPI.getAll({ search: searchVal });
      setCustomers(toArray(data?.customers));
      setTotalCount(data?.total ?? 0);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(debouncedSearch);
  }, [debouncedSearch, loadData]);

  const columns = [
    {
      key: 'full_name',
      label: 'Full Name',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase">
            {v?.[0] ?? '?'}
          </div>
          <span className="font-semibold text-gray-800">{v}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (v) => (
        <div className="flex items-center gap-1.5 text-gray-600 text-sm lowercase">
          <Mail size={14} className="text-gray-400" />
          <span>{v}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (v) => v ? (
        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
          <Phone size={14} className="text-gray-400" />
          <span>{v}</span>
        </div>
      ) : (
        <span className="text-gray-400">—</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined Date',
      render: (v) => <span>{formatDate(v)}</span>,
    },
  ];

  const openAdd = () => {
    if (!isAdmin()) return;
    setSelectedCustomer(null);
    reset();
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    if (!isAdmin()) return;
    setSelectedCustomer(row);
    reset();
    setValues({
      full_name: row.full_name || '',
      email: row.email || '',
      phone: row.phone || '',
    });
    setIsModalOpen(true);
  };

  const openDelete = (row) => {
    if (!isAdmin()) return;
    setSelectedCustomer(row);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin()) {
      toast.error('Only admins can edit or create customers');
      return;
    }

    const isValid = validate();
    if (!isValid) return;

    setIsSubmitting(true);
    const toastId = toast.loading(selectedCustomer ? 'Updating customer…' : 'Adding customer…');
    
    try {
      const payload = {
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
      };

      if (selectedCustomer) {
        await customersAPI.update(selectedCustomer.id, payload);
        toast.success('Customer updated successfully!', { id: toastId });
      } else {
        await customersAPI.create(payload);
        toast.success('Customer added successfully!', { id: toastId });
      }
      setIsModalOpen(false);
      loadData(debouncedSearch);
    } catch (err) {
      const responseErr = err?.response?.data;
      if (responseErr?.code === 'CUSTOMER_002' || responseErr?.message?.includes('Email already registered')) {
        setFieldError('email', 'This email is already registered');
        toast.dismiss(toastId);
      } else {
        toast.error(responseErr?.detail?.message || responseErr?.detail || 'An error occurred while saving', { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    if (!isAdmin()) {
      toast.error('Only admins can delete customers');
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Deleting customer…');
    try {
      await customersAPI.delete(selectedCustomer.id);
      toast.success('Customer deleted successfully!', { id: toastId });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      loadData(debouncedSearch);
    } catch (err) {
      const responseErr = err?.response?.data;
      const msg = responseErr?.detail?.message || responseErr?.detail || 'Failed to delete customer';
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Customers">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">Customers</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or email…" />
            {isAdmin() && (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <UserPlus size={16} /> Add Customer
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={customers}
          isLoading={isLoading}
          onEdit={isAdmin() ? openEdit : undefined}
          onDelete={isAdmin() ? openDelete : undefined}
          emptyIcon={<UserX size={48} className="text-gray-300" />}
          emptyTitle={searchQuery ? `No customers match "${searchQuery}"` : 'No customers yet'}
          emptyMessage={searchQuery ? 'Try a different search term' : 'Add your first customer'}
          emptyAction={
            !searchQuery && isAdmin() ? (
              <button
                onClick={openAdd}
                className="mt-4 flex items-center gap-2 mx-auto py-2.5 px-5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <UserPlus size={16} /> Add First Customer
              </button>
            ) : null
          }
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <FormInput
            label="Full Name"
            name="full_name"
            value={values.full_name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.full_name}
            touched={touched.full_name}
            placeholder="Enter full name"
            required={true}
          />

          <FormInput
            label="Email Address"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            touched={touched.email}
            placeholder="email@example.com"
            required={true}
          />

          <FormInput
            label="Phone Number"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.phone}
            touched={touched.phone}
            placeholder="+91 XXXXX XXXXX"
            optional={true}
            hint="Format: Digits, spaces, +, -, () allowed, min 7, max 20 chars."
          />

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="py-2 px-4 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {selectedCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        title="Delete Customer"
        message={`Are you sure you want to delete ${selectedCustomer?.full_name}? This action cannot be undone.`}
      />
    </Layout>
  );
}
