import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.endsWith('.vercel.app')) {
      return 'https://inventry-739f.onrender.com';
    }
  }
  return import.meta.env.DEV ? 'http://localhost:8000' : '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ims_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ims_token');
      localStorage.removeItem('ims_user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    const detail = error.response?.data?.detail;
    
    if (typeof detail === 'object' && detail?.error) {
      // Handle stock errors specially
      if (detail.code === 'ORDER_001' && detail.stock_errors) {
        const stockMessages = detail.stock_errors
          .map(e => `${e.product_name}: need ${e.requested}, have ${e.available}`)
          .join('\n');
        
        error.stockErrors = detail.stock_errors;
        error.userMessage = 'Insufficient stock:\n' + stockMessages;
      } else {
        error.userMessage = detail.message;
        error.errorCode = detail.code;
      }
    } else {
      error.userMessage = 'Something went wrong. Try again.';
    }
    
    return Promise.reject(error);
  },
);

export const authAPI = {

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ims_token', data.access_token);
    return data;
  },

  async register(userData) {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    localStorage.setItem('ims_user', JSON.stringify(data));
    return data;
  },

  logout() {
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
  },
};

export const dashboardAPI = {
  async getStats() {
    const { data } = await api.get('/dashboard/stats');
    return data;
  },

  async getRecentTransactions() {
    const { data } = await api.get('/dashboard/recent-transactions');
    return data;
  },

  async getAIInsights() {
    const { data } = await api.get('/dashboard/ai-insights');
    return data;
  },
};

export const productsAPI = {
  async getAll(filters = {}) {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.supplier_id) params.supplier_id = filters.supplier_id;
    if (filters.low_stock) params.low_stock = filters.low_stock;
    const { data } = await api.get('/products', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  async create(productData) {
    const { data } = await api.post('/products', productData);
    return data;
  },

  async update(id, productData) {
    const { data } = await api.put(`/products/${id}`, productData);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  async getLowStock() {
    const { data } = await api.get('/products/low-stock');
    return data;
  },
};

export const categoriesAPI = {
  async getAll() {
    const { data } = await api.get('/categories');
    return data;
  },

  async create(categoryData) {
    const { data } = await api.post('/categories', categoryData);
    return data;
  },

  async update(id, categoryData) {
    const { data } = await api.put(`/categories/${id}`, categoryData);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },
};

export const suppliersAPI = {
  async getAll() {
    const { data } = await api.get('/suppliers');
    return data;
  },

  async create(supplierData) {
    const { data } = await api.post('/suppliers', supplierData);
    return data;
  },

  async update(id, supplierData) {
    const { data } = await api.put(`/suppliers/${id}`, supplierData);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/suppliers/${id}`);
    return data;
  },
};

export const transactionsAPI = {
  async getAll(filters = {}) {
    const params = {};
    if (filters.product_id) params.product_id = filters.product_id;
    if (filters.type) params.type = filters.type;
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    const { data } = await api.get('/transactions', { params });
    return data;
  },

  async create(transactionData) {
    const { data } = await api.post('/transactions', transactionData);
    return data;
  },
};

export const customersAPI = {
  async getAll(params = {}) {
    const { data } = await api.get('/customers', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/customers/${id}`);
    return data;
  },

  async create(customerData) {
    const { data } = await api.post('/customers', customerData);
    return data;
  },

  async update(id, customerData) {
    const { data } = await api.put(`/customers/${id}`, customerData);
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/customers/${id}`);
    return data;
  },
};

export const ordersAPI = {
  async getAll(params = {}) {
    const { data } = await api.get('/orders', { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  async create(orderData) {
    const { data } = await api.post('/orders', orderData);
    return data;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return data;
  },

  async delete(id) {
    const { data } = await api.delete(`/orders/${id}`);
    return data;
  },
};

export default api;
