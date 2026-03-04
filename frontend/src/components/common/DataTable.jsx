import React from 'react';

export default function DataTable({
  columns = [],
  data = [],
  loading,
  emptyMessage = 'No data found',
  onRowClick,
  pagination,
  onPageChange,
  mobileCard, // optional: (row) => JSX for mobile card view
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 border-b hidden md:block" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 border-b border-gray-100 flex items-center px-4 md:px-6 gap-4">
              {columns.slice(0, 3).map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const PaginationControls = () =>
    pagination && pagination.totalPages > 1 ? (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 md:px-6 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
          {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </p>
        <div className="flex gap-1 order-1 sm:order-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ═══ Desktop Table ═══ */}
      <div className={`overflow-x-auto ${mobileCard ? 'hidden md:block' : ''}`}>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-700 whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ═══ Mobile Card View ═══ */}
      {mobileCard && (
        <div className="md:hidden divide-y divide-gray-100">
          {data.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-400">{emptyMessage}</div>
          ) : (
            data.map((row, idx) => (
              <div
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={`px-4 py-3 ${onRowClick ? 'active:bg-gray-50 cursor-pointer' : ''}`}
              >
                {mobileCard(row)}
              </div>
            ))
          )}
        </div>
      )}

      <PaginationControls />
    </div>
  );
}
