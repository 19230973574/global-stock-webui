import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Loader2, RotateCcw, Search } from 'lucide-react'
import { rebuildKlineData, type KlineRebuildResult } from '../../lib/adminDataMgmtApi'
import { dashboardPath } from '../../lib/dashboardMenus'
import { AlertBanner } from '../ui/page-elements'
import { DateInput } from '../ui/date-input'
import {
  DataMgmtActionCard,
  dataMgmtCompactFieldClass,
  dataMgmtCompactInputClass,
  dataMgmtCompactLabelClass,
} from './dataMgmtUi'

type CodeScope = 'all' | 'custom'

function parseCodesInput(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((s) => s.trim().toUpperCase().replace(/\.US$/, ''))
    .filter(Boolean)
}

type Props = {
  onRebuilt?: () => void
}

export function KlineRangeRebuildSection({ onRebuilt }: Props) {
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [codeScope, setCodeScope] = useState<CodeScope>('all')
  const [codesInput, setCodesInput] = useState('')
  const [preview, setPreview] = useState<KlineRebuildResult | null>(null)
  const [confirmPhrase, setConfirmPhrase] = useState('')
  const [loading, setLoading] = useState<'preview' | 'execute' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const needsPhrase = preview != null && (preview.allCodes || preview.previewDeleteCount > 1000)

  const buildBody = (confirm: boolean) => {
    if (!startDate || !endDate) throw new Error('请选择开始和结束日期')
    const body: Parameters<typeof rebuildKlineData>[0] = {
      startDate,
      endDate,
      allCodes: codeScope === 'all',
      confirm,
    }
    if (codeScope === 'custom') {
      const codes = parseCodesInput(codesInput)
      if (!codes.length) throw new Error('请填写至少一个股票代码')
      body.codes = codes
    }
    if (confirm && needsPhrase) {
      body.confirmPhrase = confirmPhrase.trim()
    }
    return body
  }

  const handlePreview = async () => {
    setError('')
    setSuccess('')
    setPreview(null)
    setLoading('preview')
    try {
      setPreview(await rebuildKlineData(buildBody(false)))
    } catch (err) {
      setError(err instanceof Error ? err.message : '预览失败')
    } finally {
      setLoading(null)
    }
  }

  const handleExecute = async () => {
    setError('')
    setSuccess('')
    if (!preview) {
      setError('请先预览影响范围')
      return
    }
    if (needsPhrase && confirmPhrase.trim() !== 'REBUILD') {
      setError('请输入确认词 REBUILD')
      return
    }
    if (!window.confirm(
      `将删除 ${preview.previewDeleteCount.toLocaleString()} 条 K 线，并创建 ${preview.taskCount} 个补数任务。确定执行？`,
    )) return

    setLoading('execute')
    try {
      const result = await rebuildKlineData(buildBody(true))
      setSuccess(
        `已删除 ${result.deletedCount.toLocaleString()} 条，创建 ${result.taskCount} 个重建任务（需 Python task_worker）`,
      )
      setPreview(null)
      setConfirmPhrase('')
      onRebuilt?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '重建失败')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      {error && <AlertBanner type="error" message={error} />}
      {success && (
        <div className="space-y-1">
          <AlertBanner type="success" message={success} />
          <button
            type="button"
            onClick={() => navigate(`${dashboardPath('data-mgmt/kline')}?tab=tasks`)}
            className="text-[11px] font-medium text-blue-600 hover:text-blue-800"
          >
            查看补数任务 →
          </button>
        </div>
      )}

      <DataMgmtActionCard title="区间重建" hint="大范围缺数：删区间内 K 线后自动创建补数任务">
        <div className="flex flex-wrap items-end gap-2">
          <label className={`${dataMgmtCompactFieldClass} w-[130px]`}>
            <span className={dataMgmtCompactLabelClass}>开始</span>
            <DateInput
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPreview(null) }}
              className={`${dataMgmtCompactInputClass} mt-0.5 w-full`}
            />
          </label>
          <label className={`${dataMgmtCompactFieldClass} w-[130px]`}>
            <span className={dataMgmtCompactLabelClass}>结束</span>
            <DateInput
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPreview(null) }}
              className={`${dataMgmtCompactInputClass} mt-0.5 w-full`}
            />
          </label>

          <div className={`${dataMgmtCompactFieldClass} pb-0.5`}>
            <span className={dataMgmtCompactLabelClass}>代码</span>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
              <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-slate-700">
                <input
                  type="radio"
                  name="rebuild-scope"
                  checked={codeScope === 'all'}
                  onChange={() => { setCodeScope('all'); setPreview(null) }}
                />
                全市场
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-slate-700">
                <input
                  type="radio"
                  name="rebuild-scope"
                  checked={codeScope === 'custom'}
                  onChange={() => { setCodeScope('custom'); setPreview(null) }}
                />
                指定
              </label>
            </div>
          </div>

          {codeScope === 'custom' && (
            <label className={`${dataMgmtCompactFieldClass} min-w-[160px] flex-1`}>
              <span className={dataMgmtCompactLabelClass}>股票代码</span>
              <input
                type="text"
                value={codesInput}
                onChange={(e) => { setCodesInput(e.target.value); setPreview(null) }}
                placeholder="AAPL, TSLA（最多 200 只）"
                className={`${dataMgmtCompactInputClass} mt-0.5 w-full`}
              />
            </label>
          )}

          <button type="button" onClick={handlePreview} disabled={loading !== null}
            className="btn-secondary h-8 px-2.5 text-[11px]">
            {loading === 'preview'
              ? <Loader2 className="mr-0.5 inline h-3 w-3 animate-spin" />
              : <Search className="mr-0.5 inline h-3 w-3" />}
            预览
          </button>
          <button type="button" onClick={handleExecute}
            disabled={loading !== null || !preview}
            className="btn-primary h-8 px-2.5 text-[11px]">
            {loading === 'execute'
              ? <Loader2 className="mr-0.5 inline h-3 w-3 animate-spin" />
              : <RotateCcw className="mr-0.5 inline h-3 w-3" />}
            删除并重拉
          </button>
        </div>

        {preview && (
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-700">
            <p className="font-medium text-slate-900">
              {preview.startDate} ~ {preview.endDate}
              {' · '}
              删除 <span className="text-red-600">{preview.previewDeleteCount.toLocaleString()}</span> 条
              {' · '}
              {preview.allCodes ? `全市场 ${preview.codeCount} 只` : `${preview.codeCount} 只`}
              {' · '}
              {preview.taskCount} 个任务
            </p>
            {preview.codesPreview?.length ? (
              <p className="mt-0.5 text-slate-500">示例：{preview.codesPreview.join(', ')}{preview.codeCount > 8 ? ' …' : ''}</p>
            ) : null}
            {needsPhrase && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded border border-red-200 bg-red-50 px-2 py-1.5">
                <span className="flex items-center gap-1 text-[11px] font-medium text-red-800">
                  <AlertTriangle className="h-3 w-3" />
                  输入 REBUILD 确认
                </span>
                <input
                  type="text"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="REBUILD"
                  className="input-field h-7 w-28 text-xs"
                />
              </div>
            )}
          </div>
        )}
      </DataMgmtActionCard>
    </div>
  )
}
