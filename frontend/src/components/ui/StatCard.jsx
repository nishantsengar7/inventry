import React from 'react';

const COLOR_MAP = {
  indigo: {
    bg:   'bg-indigo-50',
    icon: 'bg-indigo-600',
    text: 'text-indigo-600',
  },
  purple: {
    bg:   'bg-purple-50',
    icon: 'bg-purple-600',
    text: 'text-purple-600',
  },
  green: {
    bg:   'bg-green-50',
    icon: 'bg-green-600',
    text: 'text-green-600',
  },
  red: {
    bg:   'bg-red-50',
    icon: 'bg-red-600',
    text: 'text-red-600',
  },
  amber: {
    bg:   'bg-amber-50',
    icon: 'bg-amber-500',
    text: 'text-amber-600',
  },
};

export default function StatCard({ title, value, icon, color = 'indigo', subtitle }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.indigo;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function' || (typeof icon === 'object' && icon.$$typeof)) {
      const IconComponent = icon;
      return <IconComponent size={20} />;
    }
    return icon;
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6
                  flex items-center gap-4 hover:shadow-md hover:scale-[1.01]
                  transition-all duration-200 ${c.bg}`}
    >
      <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
        <span className="text-white">{renderIcon()}</span>
      </div>

      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{title}</p>
        {subtitle && (
          <p className={`text-xs font-medium mt-1 ${c.text}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
