import { useCallback, useEffect, useState } from 'react'
import { BarChart3, RefreshCw, Search, X } from 'lucide-react'
import { fetchKlineHistoryBars, type KlineHistoryBarPage } from '../../lib/adminDataMgmtApi'
import { AlertBanner, EmptyState, SectionCard } from '../ui/page-elements'
import { DateInput } from '../ui/date-input'
import { Pagination } from '../ui/pagination'
import {
  dataMgmtCompactFieldClass,
  dataMgmtCompactInputClass,
  dataMgmtCompactLabelClass,
} from './dataMgmtUi'

type Props = {
  filterDate?: string
  onClearDateFilter?: () => void
  refreshEpoch?: number
}

function formatNum(value?: number, digits = 2) {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function formatPct(value?: number) {
  if (value == null || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function isDefaultFirstPage(
  page: number,
  appliedCode: string,
  filterDate: string | undefined,
  startDate: string,
  endDate: string,
) {
  return page === 1 && !appliedCode && !filterDate && !startDate && !endDate
}

export function KlineHistoryBarsSection({ filterDate, onClearDateFilter, refreshEpoch = 0 }: Props) {
  const [codeKeyword, setCodeKeyword] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pageData, setPageData] = useState<KlineHistoryBarPage | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadBars = useCallback(async (refresh = false) => {
    setLoading(true)
    setError('')
    try {
      setPageData(await fetchKlineHistoryBars({
        code: appliedCode || undefined,
        date: filterDate || undefined,
        startDate: !filterDate && startDate ? startDate : undefined,
        endDate: !filterDate && endDate ? endDate : undefined,
        page,
        pageSize,
        refresh: refresh && isDefaultFirstPage(page, appliedCode, filterDate, startDate, endDate),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载 K 线数据失败')
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }, [appliedCode, endDate, filterDate, page, pageSize, startDate])

  useEffect(() => { setPage(1) }, [filterDate, appliedCode, startDate, endDate])
  useEffect(() => { loadBars(false) }, [loadBars])

  useEffect(() => {
    if (refreshEpoch > 0) loadBars(true)
  }, [refreshEpoch, loadBars])

  const handleSearch = () => {
    setPage(1)
    setAppliedCode(codeKeyword.trim().toUpperCase())
  }

  const activeFilters = [
    filterDate && { label: `交易日 ${filterDate}`, onClear: onClearDateFilter },
    appliedCode && { label: `代码 ${appliedCode}`, onClear: () => { setAppliedCode(''); setCodeKeyword('') } },
    !filterDate && startDate && { label: `起 ${startDate}`, onClear: () => setStartDate('') },
    !filterDate && endDate && { label: `止 ${endDate}`, onClear: () => setEndDate('') },
  ].filter(Boolean) as Array<{ label: string; onClear?: () => void }>

  return (
    <div className="space-y-3">
      {error && <AlertBanner type="error" message={error} />}

      <SectionCard
        title="K 线历史数据"
        description={pageData ? `共 ${pageData.total.toLocaleString()} 条 · 第 ${pageData.page} 页` : 'us_kline_history 明细'}
        noPadding
        className="[&>div:first-child]:px-3 [&>div:first-child]:py-2.5"
        action={
          <div className="flex flex-wrap items-end gap-2">
            <label className={`${dataMgmtCompactFieldClass} w-[100px]`}>
              <span className={dataMgmtCompactLabelClass}>代码</span>
              <input
                type="text"
                value={codeKeyword}
                onChange={(e) => setCodeKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="AAPL"
                className={`${dataMgmtCompactInputClass} mt-0.5 w-full`}
              />
            </label>
            {!filterDate && (
              <>
                <label className={`${dataMgmtCompactFieldClass} w-[120px]`}>
                  <span className={dataMgmtCompactLabelClass}>开始</span>
                  <DateInput value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className={`${dataMgmtCompactInputClass} mt-0.5 w-full`} />
                </label>
                <label className={`${dataMgmtCompactFieldClass} w-[120px]`}>
                  <span className={dataMgmtCompactLabelClass}>结束</span>
                  <DateInput value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className={`${dataMgmtCompactInputClass} mt-0.5 w-full`} />
                </label>
              </>
            )}
            <button type="button" onClick={handleSearch} className="btn-primary h-8 px-2.5 text-[11px]">
              <Search className="mr-0.5 inline h-3 w-3" />
              搜索
            </button>
            <button type="button" onClick={() => loadBars(true)} disabled={loading} className="btn-secondary h-8 px-2 text-[11px]">
              <RefreshCw className={`mr-0.5 inline h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        }
      >
        <div className="p-3">
          {activeFilters.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {activeFilters.map((tag) => (
                <span key={tag.label}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] text-blue-800">
                  {tag.label}
                  {tag.onClear && (
                    <button type="button" onClick={tag.onClear} className="text-blue-600 hover:text-blue-900">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {loading && !pageData ? (
            <p className="py-6 text-center text-xs text-slate-500">加载中…</p>
          ) : !pageData?.items.length ? (
            <EmptyState icon={BarChart3} title="暂无 K 线数据" description="请确认 us_kline_history 已有数据，或调整筛选条件" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="px-2 py-2 font-medium">代码</th>
                      <th className="px-2 py-2 font-medium">日期</th>
                      <th className="px-2 py-2 font-medium">开盘</th>
                      <th className="px-2 py-2 font-medium">最高</th>
                      <th className="px-2 py-2 font-medium">最低</th>
                      <th className="px-2 py-2 font-medium">收盘</th>
                      <th className="px-2 py-2 font-medium">成交量</th>
                      <th className="px-2 py-2 font-medium">涨跌幅</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.items.map((bar) => (
                      <tr key={`${bar.code}-${bar.time}`} className="border-b border-slate-50 hover:bg-slate-50/80">
                        <td className="px-2 py-2 font-mono text-xs font-medium text-slate-800">{bar.code}</td>
                        <td className="px-2 py-2 text-xs text-slate-600">{bar.time}</td>
                        <td className="px-2 py-2 text-xs tabular-nums text-slate-600">{formatNum(bar.open)}</td>
                        <td className="px-2 py-2 text-xs tabular-nums text-slate-600">{formatNum(bar.high)}</td>
                        <td className="px-2 py-2 text-xs tabular-nums text-slate-600">{formatNum(bar.low)}</td>
                        <td className="px-2 py-2 text-xs tabular-nums font-medium text-slate-800">{formatNum(bar.close)}</td>
                        <td className="px-2 py-2 text-xs tabular-nums text-slate-600">
                          {bar.volume != null ? bar.volume.toLocaleString() : '—'}
                        </td>
                        <td className={`px-2 py-2 text-xs tabular-nums ${
                          (bar.changePct ?? 0) > 0 ? 'text-red-600' : (bar.changePct ?? 0) < 0 ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {formatPct(bar.changePct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={pageData.page} pageSize={pageData.pageSize} total={pageData.total} onPageChange={setPage} />
            </>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
