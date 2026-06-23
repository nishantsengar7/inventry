import { useState } from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const PAGE_SIZE = 10;

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  onEdit,
  onDelete,
  emptyIcon,
  emptyTitle,
  emptyMessage = 'No records found',
  emptyAction,
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const start      = (page - 1) * PAGE_SIZE;
  const pageData   = data.slice(start, start + PAGE_SIZE);

  const showActions = onEdit || onDelete;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {c.label}
                  </th>
                ))}
                {showActions && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-gray-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3.5">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-4 py-3.5">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-16 ml-auto" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16
                      flex flex-col items-center gap-3 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-2">
          {emptyIcon ?? <Inbox size={36} className="text-gray-300" />}
        </div>
        {emptyTitle && (
          <p className="text-gray-700 font-semibold text-base">{emptyTitle}</p>
        )}
        <p className="text-gray-400 text-sm max-w-xs">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
              {showActions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {pageData.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className={`border-b border-gray-50 hover:bg-indigo-50/40 transition-colors duration-100
                            ${idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3.5 text-gray-700">
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                  </td>
                ))}

                {showActions && (
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-700
                                     hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600
                                     hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > PAGE_SIZE && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 text-sm text-gray-500">
          <span>
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, data.length)} of {data.length} results
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 text-gray-700 font-medium">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
