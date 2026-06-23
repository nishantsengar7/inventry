const BADGE_STYLES = {
  critical: 'bg-red-100    text-red-700    border border-red-200',
  warning:  'bg-amber-100  text-amber-700  border border-amber-200',
  low:      'bg-orange-100 text-orange-700 border border-orange-200',
  ok:       'bg-green-100  text-green-700  border border-green-200',
  IN:       'bg-green-100  text-green-700  border border-green-200',
  OUT:      'bg-red-100    text-red-700    border border-red-200',
  admin:    'bg-indigo-100 text-indigo-700 border border-indigo-200',
  viewer:   'bg-gray-100   text-gray-600   border border-gray-200',
  active:   'bg-green-100  text-green-700  border border-green-200',
  inactive: 'bg-gray-100   text-gray-500   border border-gray-200',
};

const BADGE_LABELS = {
  critical: 'Critical',
  warning:  'Warning',
  low:      'Low',
  ok:       'In Stock',
  IN:       'IN',
  OUT:      'OUT',
  admin:    'Admin',
  viewer:   'Viewer',
};

export default function Badge({ status }) {
  const style = BADGE_STYLES[status] ?? 'bg-gray-100 text-gray-600';
  const label = BADGE_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${style}`}
    >
      {label}
    </span>
  );
}
