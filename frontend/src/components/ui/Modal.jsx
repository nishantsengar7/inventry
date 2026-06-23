import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {

  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${SIZE_MAP[size]}
                    flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100
                       rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
