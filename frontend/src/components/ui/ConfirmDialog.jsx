import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message = 'Are you sure? This action cannot be undone.',
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle size={28} className="text-amber-500" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>

        <div className="flex gap-3 w-full pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm
                       font-medium text-gray-700 hover:bg-gray-50 transition-colors
                       disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm
                       font-medium hover:bg-red-700 transition-colors
                       disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
