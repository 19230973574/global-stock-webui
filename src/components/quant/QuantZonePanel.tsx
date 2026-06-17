import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  LineChart,
  Lock,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { UserAccount } from '../../lib/authApi'
import { createPurchaseOrder } from '../../lib/commerceApi'
import {
  fetchQuantKline,
  fetchQuantScreenPage,
  type QuantScreenPage,
  type QuantSignal,
} from '../../lib/quantApi'
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
import { AlertBanner, EmptyState, SectionCard } from '../ui/page-elements'

export function QuantZonePanel({
  account,
  onRefreshProfile,
  onNavigate,
}: {
  account: UserAccount
  onRefreshProfile: () => Promise<unknown>
  onNavigate: (id: string) => void
}) {
  const hasAccess = account.dataPermissions.includes('us_quant_zone')
  const [windowDays, setWindowDays] = useState(20)
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [pageData, setPageData] = useState<QuantScreenPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<QuantSignalTab>('new_high')
  const [activePeriod, setActivePeriod] = useState('1m')
  const [sortBy, setSortBy] = useState<QuantSortField>('break_pct')
  const [sortOrder, setSortOrder] = useState<QuantSortOrder>('desc')
  const [minMarketCapYi, setMinMarketCapYi] = useState('')
  const [maxMarketCapYi, setMaxMarketCapYi] = useState('')
  const [marketCapPreset, setMarketCapPreset] = useState<MarketCapPreset>('all')
  const [appliedMinMarketCap, setAppliedMinMarketCap] = useState<number | undefined>()
  const [appliedMaxMarketCap, setAppliedMaxMarketCap] = useState<number | undefined>()
  const [preview, setPreview] = useState<{ code: string; name?: string | null } | null>(null)
  const [applying, setApplying] = useState(false)
  const [applySuccess, setApplySuccess] = useState('')

  const load = useCallback(async () => {
    if (!hasAccess) return
    setLoading(true)
    setError('')
    try {
      setPageData(await fetchQuantScreenPage({
        signalType: activeTab,
        days: windowDays,
        period: activeTab === 'period_high' ? activePeriod : undefined,
        page,
        pageSize,
        minMarketCap: appliedMinMarketCap,
        maxMarketCap: appliedMaxMarketCap,
        sortBy,
        sortOrder,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }, [hasAccess, activeTab, windowDays, activePeriod, page, pageSize, appliedMinMarketCap, appliedMaxMarketCap, sortBy, sortOrder])

  useEffect(() => { load() }, [load])

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
    if (!item) return

    if (preset === 'custom') return

    setMinMarketCapYi(item.minYi != null ? String(item.minYi) : '')
    setMaxMarketCapYi(item.maxYi != null ? String(item.maxYi) : '')

    const { min, max } = applyMarketCapFromPreset(preset)
    setPage(1)
    setAppliedMinMarketCap(min)
    setAppliedMaxMarketCap(max)
  }

  const handleApplyFilters = () => {
    setPage(1)
    if (marketCapPreset === 'custom') {
      setAppliedMinMarketCap(parseMarketCapYi(minMarketCapYi))
      setAppliedMaxMarketCap(parseMarketCapYi(maxMarketCapYi))
      setMarketCapPreset(
        detectMarketCapPreset(
          parseMarketCapYi(minMarketCapYi),
          parseMarketCapYi(maxMarketCapYi),
        ),
      )
    } else {
      const { min, max } = applyMarketCapFromPreset(marketCapPreset)
      setAppliedMinMarketCap(min)
      setAppliedMaxMarketCap(max)
    }
  }

  const handleResetFilters = () => {
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

  const handleApply = async () => {
    setApplying(true)
    setError('')
    setApplySuccess('')
    try {
      const order = await createPurchaseOrder('us_quant_zone')
      await onRefreshProfile()
      if (order.status === 'approved') {
        setApplySuccess('量化专区已开通，请刷新页面后在左侧菜单进入')
      } else {
        setApplySuccess('申请已提交，审核通过后即可使用量化专区')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '申请失败')
    } finally {
      setApplying(false)
    }
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-10">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <div className="relative flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 ring-4 ring-white/25">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">量化专区</h2>
                <p className="mt-1 text-sm text-blue-100">申请开通后，可使用美股新高新低与周期突破筛选</p>
              </div>
            </div>
          </div>
        </div>

        {error && <AlertBanner type="error" message={error} />}
        {applySuccess && <AlertBanner type="success" message={applySuccess} />}

        <SectionCard title="专区能力" description="基于最近一个交易日的日 K 数据">
          <div className="grid gap-3 sm:grid-cols-2">
            <FeatureCard
              icon={TrendingUp}
              title="X 日新高 / 新低"
              desc="收盘价突破前 N 日极值，可叠加市值区间过滤"
            />
            <FeatureCard
              icon={Sparkles}
              title="周期新高"
              desc="一月、三月、半年、一年新高突破一览"
            />
          </div>
          <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-800">
            开通前提：需已拥有「美股历史」权限（`us_history`），量化专区将在此基础上提供筛选能力。
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={handleApply} disabled={applying} className="btn-primary h-9 text-xs">
              {applying ? '提交中…' : '申请开通量化专区'}
            </button>
            <button type="button" onClick={() => onNavigate('marketplace')} className="btn-secondary h-9 text-xs">
              前往数据采购
            </button>
          </div>
        </SectionCard>
      </div>
    )
  }

  const list = pageData?.items ?? []
  const hasActiveFilters = appliedMinMarketCap != null || appliedMaxMarketCap != null

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <LineChart className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">量化专区 · 美股</h2>
              <p className="text-[11px] text-blue-100">
                {pageData?.tradeDate ?? '—'} · 命中 {pageData?.total ?? 0}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-md bg-white/15 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-white/25 disabled:opacity-60"
          >
            <RefreshCw className={`mr-1 inline h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
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
        onTabChange={handleTabChange}
        onWindowDaysChange={(days) => { setWindowDays(days); setPage(1) }}
        onPeriodChange={(period) => { setActivePeriod(period); setPage(1) }}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        onMinMarketCapYiChange={setMinMarketCapYi}
        onMaxMarketCapYiChange={setMaxMarketCapYi}
        onMarketCapPresetChange={handleMarketCapPresetChange}
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
      />

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">{panelTitle(activeTab, windowDays, activePeriod)}</p>
            <p className="text-[11px] text-slate-400">{panelDesc(activeTab, windowDays)}</p>
          </div>
          {pageData && (
            <p className="text-[11px] text-slate-400">
              第 {pageData.page} 页 · 共 {pageData.total} 条
            </p>
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
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="px-3 py-2 font-medium">代码</th>
                    <th className="px-3 py-2 font-medium">名称</th>
                    <th className="px-3 py-2 font-medium">市值</th>
                    <SortableTh label="收盘价" field="close" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    <th className="px-3 py-2 font-medium">前极值</th>
                    <SortableTh label="突破幅度" field="break_pct" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    <th className="px-3 py-2 font-medium">交易日</th>
                    <th className="px-3 py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((signal) => (
                    <SignalRow
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
        fetchBars={fetchQuantKline}
        title="美股日 K 预览"
      />
    </div>
  )
}

function SignalRow({ signal, onPreview }: { signal: QuantSignal; onPreview: () => void }) {
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

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
    </div>
  )
}
