import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  debounce = 300,
}) {
  const timerRef = useRef(null);

  const handleChange = (e) => {
    const raw = e.target.value;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(raw), debounce);

    e.target._deferred = raw;
  };

  const handleClear = () => {
    clearTimeout(timerRef.current);
    onChange('');
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="relative flex items-center">
      <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
      <input
        type="text"
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                   placeholder-gray-400 text-black w-64 transition-all"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
