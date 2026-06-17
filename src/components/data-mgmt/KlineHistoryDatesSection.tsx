import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Eye, Loader2, RefreshCw } from 'lucide-react'
import {
  fetchKlineTradeDates,
  KLINE_TASK_STATUS_COLOR,
  KLINE_TASK_STATUS_LABEL,
  type KlineTradeDateItem,
  type KlineTradeDatePage,
} from '../../lib/adminDataMgmtApi'
import { dashboardPath } from '../../lib/dashboardMenus'
import { AlertBanner, EmptyState, SectionCard } from '../ui/page-elements'
import { DateInput } from '../ui/date-input'
import { Pagination } from '../ui/pagination'
import {
  dataMgmtCompactFieldClass,
  dataMgmtCompactInputClass,
  dataMgmtCompactLabelClass,
} from './dataMgmtUi'

function formatTaskTime(ms?: number | null) {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function SyncStatusCell({ row }: { row: KlineTradeDateItem }) {
  if (!row.syncStatus) {
    return <span className="text-xs text-slate-400">—</span>
  }
  return (
    <div className="space-y-0.5">
      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${KLINE_TASK_STATUS_COLOR[row.syncStatus] ?? 'bg-slate-100'}`}>
        {KLINE_TASK_STATUS_LABEL[row.syncStatus] ?? row.syncStatus}
      </span>
      {(row.syncTaskStartDate || row.syncTaskEndDate) && (
        <p className="text-[10px] text-slate-500">
          区间 {row.syncTaskStartDate ?? '—'} ~ {row.syncTaskEndDate ?? '—'}
        </p>
      )}
      <p className="text-[10px] text-slate-400">
        开始 {formatTaskTime(row.syncStartedAt)} · 结束 {formatTaskTime(row.syncFinishedAt)}
      </p>
    </div>
  )
}

export function KlineHistoryDatesSection({ refreshEpoch = 0 }: { refreshEpoch?: number }) {
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedStart, setAppliedStart] = useState('')
  const [appliedEnd, setAppliedEnd] = useState('')
  const [pageData, setPageData] = useState<KlineTradeDatePage | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDates = useCallback(async (refresh = false) => {
    setLoading(true)
    setError('')
    try {
      setPageData(await fetchKlineTradeDates({
        startDate: appliedStart || undefined,
        endDate: appliedEnd || undefined,
        page,
        pageSize,
        refresh,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载交易日失败')
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }, [appliedEnd, appliedStart, page, pageSize])

  useEffect(() => { loadDates(false) }, [loadDates])

  useEffect(() => {
    if (refreshEpoch > 0) loadDates(true)
  }, [refreshEpoch, loadDates])

  const hasActiveSync = useMemo(
    () => pageData?.items.some((row) => row.syncStatus === 'PENDING' || row.syncStatus === 'RUNNING') ?? false,
    [pageData],
  )

  useEffect(() => {
    if (!hasActiveSync) return
    const timer = window.setInterval(() => loadDates(false), 5000)
    return () => window.clearInterval(timer)
  }, [hasActiveSync, loadDates])

  const handleFilter = () => {
    setPage(1)
    setAppliedStart(startDate)
    setAppliedEnd(endDate)
  }

  return (
    <div className="space-y-3">
      {error && <AlertBanner type="error" message={error} />}

      {hasActiveSync && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          有补数任务进行中，列表将自动刷新同步状态
        </div>
      )}

      <SectionCard
        title="已有数据的交易日"
        description="浏览覆盖情况；大范围缺数请用上方区间重建"
        noPadding
        className="[&>div:first-child]:px-3 [&>div:first-child]:py-2.5"
        action={
          <div className="flex flex-wrap items-end gap-2">
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
            <button type="button" onClick={handleFilter} className="btn-secondary h-8 px-2.5 text-[11px]">
              筛选
            </button>
            <button type="button" onClick={() => loadDates(true)} disabled={loading} className="btn-secondary h-8 px-2 text-[11px]">
              <RefreshCw className={`mr-0.5 inline h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        }
      >
        <div className="p-3">
          {loading && !pageData ? (
            <p className="py-6 text-center text-xs text-slate-500">加载中…</p>
          ) : !pageData?.items.length ? (
            <EmptyState icon={CalendarDays} title="暂无交易日" description="请确认 us_kline_history 已有数据" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="px-2 py-2 font-medium">交易日</th>
                      <th className="px-2 py-2 font-medium">K 线条数</th>
                      <th className="px-2 py-2 font-medium">同步状态</th>
                      <th className="px-2 py-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.items.map((row) => (
                      <tr key={row.date}
                        className={`border-b border-slate-50 hover:bg-slate-50/80 ${row.syncStatus ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-2 py-2 text-xs font-medium text-slate-800">{row.date}</td>
                        <td className="px-2 py-2 text-xs tabular-nums text-slate-600">{row.barCount.toLocaleString()}</td>
                        <td className="px-2 py-2">
                          <SyncStatusCell row={row} />
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => navigate(`${dashboardPath('data-mgmt/kline')}?date=${encodeURIComponent(row.date)}`)}
                            className="btn-secondary h-7 px-2 text-[11px]">
                            <Eye className="mr-0.5 inline h-3 w-3" />
                            查看数据
                          </button>
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
