export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null

  const pages = buildPageList(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-xs text-slate-500">
        共 {total} 条 · 第 {page}/{totalPages} 页
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn-secondary h-8 px-3 text-xs disabled:opacity-50"
        >
          上一页
        </button>
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition-colors ${
              page === item ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-secondary h-8 px-3 text-xs disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  )
}

function buildPageList(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
}
