import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  LineChart,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  fetchAdminQuantKline,
  fetchAdminQuantOverview,
  fetchAdminQuantScreenPage,
  type QuantDataOverview,
} from '../../lib/adminQuantApi'
import type { QuantScreenPage, QuantSignal } from '../../lib/quantApi'
import { QuantKlinePreview } from './QuantKlinePreview'
import {
  ActiveFilterTags,
  detectMarketCapPreset,
  formatMarketCap,
  formatPrice,
  MARKET_CAP_PRESETS,
  MARKET_CAP_UNIT,
  panelDesc,
  panelTitle,
  parseMarketCapYi,
  QuantFilterPanel,
  defaultQuantSort,
  nextQuantSort,
  SortableTh,
  type MarketCapPreset,
  type QuantSignalTab,
  type QuantSortField,
  type QuantSortOrder,
} from './QuantFilterPanel'
import { Pagination } from '../ui/pagination'
import { AlertBanner, EmptyState } from '../ui/page-elements'

export function AdminQuantDataPanel() {
  const [overview, setOverview] = useState<QuantDataOverview | null>(null)
  const [pageData, setPageData] = useState<QuantScreenPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [windowDays, setWindowDays] = useState(20)
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [codeKeyword, setCodeKeyword] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [minMarketCapYi, setMinMarketCapYi] = useState('')
  const [maxMarketCapYi, setMaxMarketCapYi] = useState('')
  const [marketCapPreset, setMarketCapPreset] = useState<MarketCapPreset>('all')
  const [appliedMinMarketCap, setAppliedMinMarketCap] = useState<number | undefined>()
  const [appliedMaxMarketCap, setAppliedMaxMarketCap] = useState<number | undefined>()
  const [activeTab, setActiveTab] = useState<QuantSignalTab>('new_high')
  const [activePeriod, setActivePeriod] = useState('1m')
  const [sortBy, setSortBy] = useState<QuantSortField>('break_pct')
  const [sortOrder, setSortOrder] = useState<QuantSortOrder>('desc')
  const [preview, setPreview] = useState<{ code: string; name?: string | null } | null>(null)

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await fetchAdminQuantOverview())
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载概览失败')
    }
  }, [])

  const loadScreen = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPageData(await fetchAdminQuantScreenPage({
        signalType: activeTab,
        days: windowDays,
        period: activeTab === 'period_high' ? activePeriod : undefined,
        page,
        pageSize,
        code: appliedCode || undefined,
        minMarketCap: appliedMinMarketCap,
        maxMarketCap: appliedMaxMarketCap,
        sortBy,
        sortOrder,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载筛选结果失败')
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }, [activeTab, windowDays, activePeriod, page, pageSize, appliedCode, appliedMinMarketCap, appliedMaxMarketCap, sortBy, sortOrder])

  useEffect(() => { loadOverview() }, [loadOverview])
  useEffect(() => { loadScreen() }, [loadScreen])

  const applyMarketCapFromPreset = (preset: MarketCapPreset) => {
    const item = MARKET_CAP_PRESETS.find((p) => p.id === preset)
    if (!item || preset === 'custom') return { min: undefined, max: undefined }
    return {
      min: item.minYi != null ? item.minYi * MARKET_CAP_UNIT : undefined,
      max: item.maxYi != null ? item.maxYi * MARKET_CAP_UNIT : undefined,
    }
  }

  const handleMarketCapPresetChange = (preset: MarketCapPreset) => {
    setMarketCapPreset(preset)
    const item = MARKET_CAP_PRESETS.find((p) => p.id === preset)
    if (!item || preset === 'custom') return

    setMinMarketCapYi(item.minYi != null ? String(item.minYi) : '')
    setMaxMarketCapYi(item.maxYi != null ? String(item.maxYi) : '')

    const { min, max } = applyMarketCapFromPreset(preset)
    setPage(1)
    setAppliedMinMarketCap(min)
    setAppliedMaxMarketCap(max)
  }

  const handleApplyFilters = () => {
    setPage(1)
    setAppliedCode(codeKeyword.trim().toUpperCase())

    if (marketCapPreset === 'custom') {
      const min = parseMarketCapYi(minMarketCapYi)
      const max = parseMarketCapYi(maxMarketCapYi)
      setAppliedMinMarketCap(min)
      setAppliedMaxMarketCap(max)
      setMarketCapPreset(detectMarketCapPreset(min, max))
    } else {
      const { min, max } = applyMarketCapFromPreset(marketCapPreset)
      setAppliedMinMarketCap(min)
      setAppliedMaxMarketCap(max)
    }
  }

  const handleResetFilters = () => {
    setCodeKeyword('')
    setAppliedCode('')
    setMinMarketCapYi('')
    setMaxMarketCapYi('')
    setMarketCapPreset('all')
    setAppliedMinMarketCap(undefined)
    setAppliedMaxMarketCap(undefined)
    setPage(1)
  }

  const handleTabChange = (tab: QuantSignalTab) => {
    const defaults = defaultQuantSort(tab)
    setSortBy(defaults.sortBy)
    setSortOrder(defaults.sortOrder)
    setActiveTab(tab)
    setPage(1)
  }

  const handleSort = (field: QuantSortField) => {
    const next = nextQuantSort(field, sortBy, sortOrder)
    setSortBy(next.sortBy)
    setSortOrder(next.sortOrder)
    setPage(1)
  }

  const list = pageData?.items ?? []
  const hasActiveFilters = Boolean(
    appliedCode || appliedMinMarketCap != null || appliedMaxMarketCap != null,
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <LineChart className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">量化数据 · 美股</h2>
            <p className="text-[11px] text-blue-100">
              {pageData?.tradeDate ?? overview?.latestTradeDate ?? '—'} · {overview?.symbolCount ?? '—'} 标的 · 命中 {pageData?.total ?? '—'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { loadOverview(); loadScreen() }}
          disabled={loading}
          className="rounded-md bg-white/15 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-white/25 disabled:opacity-60"
        >
          <RefreshCw className={`mr-1 inline h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      <QuantFilterPanel
        activeTab={activeTab}
        windowDays={windowDays}
        activePeriod={activePeriod}
        pageSize={pageSize}
        minMarketCapYi={minMarketCapYi}
        maxMarketCapYi={maxMarketCapYi}
        marketCapPreset={marketCapPreset}
        appliedMinMarketCap={appliedMinMarketCap}
        appliedMaxMarketCap={appliedMaxMarketCap}
        codeKeyword={codeKeyword}
        showCodeSearch
        onTabChange={handleTabChange}
        onWindowDaysChange={(days) => { setWindowDays(days); setPage(1) }}
        onPeriodChange={(period) => { setActivePeriod(period); setPage(1) }}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        onMinMarketCapYiChange={setMinMarketCapYi}
        onMaxMarketCapYiChange={setMaxMarketCapYi}
        onMarketCapPresetChange={handleMarketCapPresetChange}
        onCodeKeywordChange={setCodeKeyword}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <ActiveFilterTags
        activeTab={activeTab}
        windowDays={windowDays}
        activePeriod={activePeriod}
        appliedMinMarketCap={appliedMinMarketCap}
        appliedMaxMarketCap={appliedMaxMarketCap}
        appliedCode={appliedCode}
      />

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">{panelTitle(activeTab, windowDays, activePeriod)}</p>
            <p className="text-[11px] text-slate-400">{panelDesc(activeTab, windowDays)}</p>
          </div>
          {pageData && (
            <p className="text-[11px] text-slate-400">第 {pageData.page} 页 · 共 {pageData.total} 条</p>
          )}
        </div>
        <div className="p-3">
        {loading ? (
          <p className="py-6 text-center text-xs text-slate-500">全市场扫描中，首次约需 2–3 分钟，完成后翻页会很快…</p>
        ) : list.length === 0 ? (
          <EmptyState
            icon={activeTab === 'new_low' ? TrendingDown : TrendingUp}
            title="暂无结果"
            description="调整筛选条件后重试"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="px-3 py-2 font-medium">代码</th>
                    <th className="px-3 py-2 font-medium">名称</th>
                    <th className="px-3 py-2 font-medium">市值</th>
                    <SortableTh label="收盘价" field="close" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    <th className="px-3 py-2 font-medium">最高</th>
                    <th className="px-3 py-2 font-medium">最低</th>
                    <th className="px-3 py-2 font-medium">前极值</th>
                    <SortableTh label="突破幅度" field="break_pct" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    <th className="px-3 py-2 font-medium">交易日</th>
                    <th className="px-3 py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((signal) => (
                    <AdminSignalRow
                      key={`${signal.code}-${signal.signalType}-${signal.windowDays}-${signal.period ?? ''}`}
                      signal={signal}
                      onPreview={() => setPreview({ code: signal.code, name: signal.name })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {pageData && (
              <Pagination
                page={pageData.page}
                pageSize={pageData.pageSize}
                total={pageData.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
        </div>
      </div>

      <QuantKlinePreview
        code={preview?.code ?? null}
        name={preview?.name}
        onClose={() => setPreview(null)}
        fetchBars={fetchAdminQuantKline}
        title="美股日 K 预览"
      />
    </div>
  )
}

function AdminSignalRow({ signal, onPreview }: { signal: QuantSignal; onPreview: () => void }) {
  const positive = signal.signalType !== 'new_low'
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/80">
      <td className="px-2 py-2 font-mono text-xs font-semibold text-slate-900">{signal.code}</td>
      <td className="max-w-[120px] truncate px-2 py-2 text-xs text-slate-600" title={signal.name ?? undefined}>
        {signal.name ?? '—'}
      </td>
      <td className="px-2 py-2 tabular-nums text-xs font-medium text-slate-700" title={signal.marketCap != null ? String(signal.marketCap) : undefined}>
        {formatMarketCap(signal.marketCap)}
      </td>
      <td className="px-2 py-2 tabular-nums text-xs text-slate-700">{formatPrice(signal.close)}</td>
      <td className="px-2 py-2 tabular-nums text-xs text-slate-600">{formatPrice(signal.high)}</td>
      <td className="px-2 py-2 tabular-nums text-xs text-slate-600">{formatPrice(signal.low)}</td>
      <td className="px-2 py-2 tabular-nums text-xs text-slate-500">{formatPrice(signal.priorExtreme)}</td>
      <td className="px-2 py-2">
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${
          positive ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {signal.breakPct > 0 ? '+' : ''}{signal.breakPct}%
        </span>
      </td>
      <td className="px-2 py-2 text-[11px] text-slate-500">{signal.tradeDate?.slice(0, 10)}</td>
      <td className="px-2 py-2">
        <button type="button" onClick={onPreview} className="btn-secondary h-7 px-2 text-[11px]">
          <Eye className="mr-0.5 inline h-3 w-3" />
          K线
        </button>
      </td>
    </tr>
  )
}
