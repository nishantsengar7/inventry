export function toArray(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') {
    return val.results ?? val.items ?? val.data ?? [];
  }
  return [];
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  const date = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${date} at ${time}`;
}

export function getStockStatus(quantity, threshold) {
  if (quantity === 0)                      return 'critical';
  if (quantity <= Math.floor(threshold / 2)) return 'warning';
  if (quantity <= threshold)               return 'low';
  return 'ok';
}

export function truncateText(text, maxLength = 40) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}

export function generateSKU() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SKU-${suffix}`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = item[key];
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {});
}

export function formatOrderId(id) {
  if (id === null || id === undefined) return '#000';
  return '#' + String(id).padStart(3, '0');
}

export function getOrderStatusColor(status) {
  const colors = {
    pending: 'amber',
    completed: 'green',
    cancelled: 'red',
  };
  return colors[status?.toLowerCase()] || 'gray';
}

export function calculateOrderTotal(items) {
  if (!Array.isArray(items)) return 0.0;
  return items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + (qty * price);
  }, 0.0);
}

export function getStockWarning(available, requested) {
  const avail = Number(available) || 0;
  const req = Number(requested) || 0;
  if (req > avail) {
    return `Only ${avail} units available`;
  }
  return null;
}
