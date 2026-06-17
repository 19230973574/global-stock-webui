import { useCallback, useEffect, useState } from 'react'
import { CalendarRange, Loader2, Play, XCircle } from 'lucide-react'
import {
  cancelKlineFetchTask,
  createKlineFetchTask,
  fetchKlineFetchTasks,
  KLINE_TASK_STATUS_COLOR,
  KLINE_TASK_STATUS_LABEL,
  KLINE_TASK_TYPE_LABEL,
  type KlineFetchTask,
  type KlineFetchTaskPage,
} from '../../lib/adminDataMgmtApi'
import { AlertBanner, EmptyState, SectionCard } from '../ui/page-elements'
import { DateInput } from '../ui/date-input'
import { Pagination } from '../ui/pagination'
import {
  dataMgmtInputClass,
  dataMgmtLabelClass,
  dataMgmtTextareaClass,
} from './dataMgmtUi'

function parseCodesInput(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((s) => s.trim().toUpperCase().replace(/\.US$/, ''))
    .filter(Boolean)
}

function formatTime(ms?: number) {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('zh-CN', { hour12: false })
}

export function KlineFetchTaskSection() {
  const [codesInput, setCodesInput] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pageData, setPageData] = useState<KlineFetchTaskPage | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      setPageData(await fetchKlineFetchTasks({ page, pageSize: 10 }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载任务失败')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadTasks() }, [loadTasks])

  const hasActive = pageData?.items.some((t) => t.status === 'PENDING' || t.status === 'RUNNING')
  useEffect(() => {
    if (!hasActive) return
    const timer = window.setInterval(loadTasks, 5000)
    return () => window.clearInterval(timer)
  }, [hasActive, loadTasks])

  const handleCreate = async () => {
    setError('')
    setSuccess('')
    const codes = parseCodesInput(codesInput)
    if (!codes.length || !startDate || !endDate) {
      setError('请填写代码、开始日期和结束日期')
      return
    }
    setCreating(true)
    try {
      const task = await createKlineFetchTask({ codes, startDate, endDate })
      setSuccess(`任务已创建：${task.id}，需启动 Python task_worker 后执行`)
      setCodesInput('')
      setPage(1)
      await loadTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败')
    } finally {
      setCreating(false)
    }
  }

  const handleCancel = async (taskId: string) => {
    try {
      await cancelKlineFetchTask(taskId)
      await loadTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消失败')
    }
  }

  return (
    <div className="space-y-5">
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <SectionCard
        title="拉取历史日 K"
        description="按代码 + 日期区间创建任务，由 Python task_worker 从 LongPort 拉取并写入 us_kline_history"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className={dataMgmtLabelClass}>股票代码（逗号或换行分隔）</span>
            <textarea
              value={codesInput}
              onChange={(e) => setCodesInput(e.target.value)}
              rows={3}
              placeholder="AAPL, TSLA, NVDA"
              className={dataMgmtTextareaClass}
            />
          </label>
          <label className="block">
            <span className={dataMgmtLabelClass}>开始日期</span>
            <DateInput value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className={dataMgmtInputClass} />
          </label>
          <label className="block">
            <span className={dataMgmtLabelClass}>结束日期</span>
            <DateInput value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className={dataMgmtInputClass} />
          </label>
        </div>
        <button type="button" onClick={handleCreate} disabled={creating}
          className="btn-primary mt-3 h-8 px-3 text-xs">
          {creating ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 inline h-3.5 w-3.5" />}
          创建拉取任务
        </button>
      </SectionCard>

      <SectionCard title="拉取任务列表" noPadding>
        <div className="p-3">
          {loading && !pageData ? (
            <p className="py-4 text-center text-xs text-slate-500">加载中…</p>
          ) : !pageData?.items.length ? (
            <EmptyState icon={CalendarRange} title="暂无任务" description="创建拉取任务后将显示在这里" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="px-2 py-2 font-medium">类型</th>
                      <th className="px-2 py-2 font-medium">任务 ID</th>
                      <th className="px-2 py-2 font-medium">代码</th>
                      <th className="px-2 py-2 font-medium">日期区间</th>
                      <th className="px-2 py-2 font-medium">状态</th>
                      <th className="px-2 py-2 font-medium">进度</th>
                      <th className="px-2 py-2 font-medium">开始时间</th>
                      <th className="px-2 py-2 font-medium">结束时间</th>
                      <th className="px-2 py-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.items.map((task) => (
                      <TaskRow key={task.id} task={task} onCancel={handleCancel} />
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

function TaskRow({ task, onCancel }: { task: KlineFetchTask; onCancel: (id: string) => void }) {
  const progress = task.progress
  const progressText = progress
    ? `${progress.doneCodes}/${progress.totalCodes} 代码 · ${progress.savedBars} 条`
    : '—'
  const codesPreview = task.codes.length <= 3
    ? task.codes.join(', ')
    : `${task.codes.slice(0, 3).join(', ')} 等 ${task.codes.length} 只`

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/80">
      <td className="px-2 py-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {KLINE_TASK_TYPE_LABEL[task.type] ?? task.type}
        </span>
      </td>
      <td className="px-2 py-2 font-mono text-[11px] text-slate-700">{task.id}</td>
      <td className="max-w-[140px] truncate px-2 py-2 text-xs text-slate-600" title={task.codes.join(', ')}>{codesPreview}</td>
      <td className="px-2 py-2 text-[11px] text-slate-600">{task.startDate} ~ {task.endDate}</td>
      <td className="px-2 py-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${KLINE_TASK_STATUS_COLOR[task.status] ?? 'bg-slate-100'}`}>
          {KLINE_TASK_STATUS_LABEL[task.status] ?? task.status}
        </span>
        {task.status === 'RUNNING' && progress?.currentCode && (
          <p className="mt-0.5 text-[10px] text-slate-400">正在: {progress.currentCode}</p>
        )}
      </td>
      <td className="px-2 py-2 text-[11px] text-slate-600">{progressText}</td>
      <td className="px-2 py-2 text-[11px] text-slate-500">{formatTime(task.startedAt ?? task.createdAt)}</td>
      <td className="px-2 py-2 text-[11px] text-slate-500">{formatTime(task.finishedAt)}</td>
      <td className="px-2 py-2">
        {task.status === 'PENDING' && (
          <button type="button" onClick={() => onCancel(task.id)} className="btn-secondary h-7 px-2 text-[11px]">
            <XCircle className="mr-0.5 inline h-3 w-3" />
            取消
          </button>
        )}
        {task.result?.failedCodes?.length ? (
          <p className="mt-1 text-[10px] text-amber-600" title={task.result.failedCodes.join(', ')}>
            失败 {task.result.failedCodes.length} 只
          </p>
        ) : null}
      </td>
    </tr>
  )
}
