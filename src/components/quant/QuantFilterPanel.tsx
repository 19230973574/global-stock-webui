import { Database, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { Input } from '../ui/input'

export const WINDOW_OPTIONS = [5, 10, 20, 60] as const
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export const MARKET_CAP_UNIT = 100_000_000

export type QuantSignalTab = 'new_high' | 'new_low' | 'period_high'

export type QuantSortField = 'break_pct' | 'close'
export type QuantSortOrder = 'asc' | 'desc'

export type MarketCapPreset = 'all' | 'small' | 'mid' | 'large' | 'mega' | 'custom'

export const MARKET_CAP_PRESETS: Array<{
  id: MarketCapPreset
  label: string
  minYi?: number
  maxYi?: number
}> = [
  { id: 'all', label: '不限' },
  { id: 'small', label: '<10亿', maxYi: 10 },
  { id: 'mid', label: '10~100亿', minYi: 10, maxYi: 100 },
  { id: 'large', label: '100~1000亿', minYi: 100, maxYi: 1000 },
  { id: 'mega', label: '≥1000亿', minYi: 1000 },
  { id: 'custom', label: '自定义' },
]

export const PERIOD_LABELS: Record<string, string> = {
  '1m': '一月',
  '3m': '三月',
  '6m': '半年',
  '1y': '一年',
}

export function parseMarketCapYi(input: string) {
  const value = Number.parseFloat(input)
  if (!input.trim() || Number.isNaN(value) || value <= 0) return undefined
  return value * MARKET_CAP_UNIT
}

export function formatMarketCapYi(value: number) {
  return `${(value / MARKET_CAP_UNIT).toFixed(2)}亿`
}

export function formatMarketCap(value: number | null | undefined) {
  if (value == null) return '—'
  const yi = value / MARKET_CAP_UNIT
  if (yi >= 10000) return `${(yi / 10000).toFixed(1)}万亿`
  if (yi >= 1) return `${yi.toFixed(1)}亿`
  return `${(value / 1_000_000).toFixed(1)}M`
}

export function formatPrice(value: number | null | undefined) {
  if (value == null) return '—'
  return value.toFixed(2)
}

export function detectMarketCapPreset(min?: number, max?: number): MarketCapPreset {
  if (min == null && max == null) return 'all'
  for (const preset of MARKET_CAP_PRESETS) {
    if (preset.id === 'all' || preset.id === 'custom') continue
    const presetMin = preset.minYi != null ? preset.minYi * MARKET_CAP_UNIT : undefined
    const presetMax = preset.maxYi != null ? preset.maxYi * MARKET_CAP_UNIT : undefined
    if (min === presetMin && max === presetMax) return preset.id
  }
  return 'custom'
}

type QuantFilterPanelProps = {
  activeTab: QuantSignalTab
  windowDays: number
  activePeriod: string
  pageSize: number
  minMarketCapYi: string
  maxMarketCapYi: string
  marketCapPreset: MarketCapPreset
  appliedMinMarketCap?: number
  appliedMaxMarketCap?: number
  codeKeyword?: string
  showCodeSearch?: boolean
  onTabChange: (tab: QuantSignalTab) => void
  onWindowDaysChange: (days: number) => void
  onPeriodChange: (period: string) => void
  onPageSizeChange: (size: number) => void
  onMinMarketCapYiChange: (value: string) => void
  onMaxMarketCapYiChange: (value: string) => void
  onMarketCapPresetChange: (preset: MarketCapPreset) => void
  onCodeKeywordChange?: (value: string) => void
  onApply: () => void
  onReset: () => void
  hasActiveFilters: boolean
}

export function QuantFilterPanel({
  activeTab,
  windowDays,
  activePeriod,
  pageSize,
  minMarketCapYi,
  maxMarketCapYi,
  marketCapPreset,
  appliedMinMarketCap,
  appliedMaxMarketCap,
  codeKeyword = '',
  showCodeSearch = false,
  onTabChange,
  onWindowDaysChange,
  onPeriodChange,
  onPageSizeChange,
  onMinMarketCapYiChange,
  onMaxMarketCapYiChange,
  onMarketCapPresetChange,
  onCodeKeywordChange,
  onApply,
  onReset,
  hasActiveFilters,
}: QuantFilterPanelProps) {
  const criteriaLine = buildCriteriaLine({
    activeTab,
    windowDays,
    activePeriod,
    appliedMinMarketCap,
    appliedMaxMarketCap,
  })

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      {/* 行1：信号 + 窗口 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <FilterRow label="信号">
          {([
            { id: 'new_high' as const, label: '新高', icon: TrendingUp },
            { id: 'new_low' as const, label: '新低', icon: TrendingDown },
            { id: 'period_high' as const, label: '周期', icon: Database },
          ]).map((tab) => (
            <ChipButton key={tab.id} active={activeTab === tab.id} onClick={() => onTabChange(tab.id)}>
              <tab.icon className="mr-1 inline h-3 w-3" />
              {tab.label}
            </ChipButton>
          ))}
        </FilterRow>

        <div className="hidden h-4 w-px bg-slate-200 sm:block" />

        <FilterRow label={activeTab === 'period_high' ? '周期' : '窗口'}>
          {activeTab !== 'period_high'
            ? WINDOW_OPTIONS.map((days) => (
                <ChipButton key={days} active={windowDays === days} onClick={() => onWindowDaysChange(days)}>
                  {days}日
                </ChipButton>
              ))
            : Object.entries(PERIOD_LABELS).map(([period, label]) => (
                <ChipButton key={period} active={activePeriod === period} onClick={() => onPeriodChange(period)}>
                  {label}
                </ChipButton>
              ))}
        </FilterRow>
      </div>

      {/* 行2：市值 */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-2">
        <FilterRow label="市值">
          {MARKET_CAP_PRESETS.map((preset) => (
            <ChipButton
              key={preset.id}
              active={marketCapPreset === preset.id}
              onClick={() => onMarketCapPresetChange(preset.id)}
            >
              {preset.label}
            </ChipButton>
          ))}
        </FilterRow>

        {marketCapPreset === 'custom' && (
          <div className="flex items-center gap-1.5">
            <Input
              value={minMarketCapYi}
              onChange={(e) => onMinMarketCapYiChange(e.target.value)}
              placeholder="最小(亿)"
              className="input-field h-7 w-20 px-2 text-xs"
            />
            <span className="text-[10px] text-slate-400">~</span>
            <Input
              value={maxMarketCapYi}
              onChange={(e) => onMaxMarketCapYiChange(e.target.value)}
              placeholder="最大(亿)"
              className="input-field h-7 w-20 px-2 text-xs"
            />
          </div>
        )}
      </div>

      {/* 行3：辅助 + 操作 */}
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
        {showCodeSearch && onCodeKeywordChange && (
          <Input
            value={codeKeyword}
            onChange={(e) => onCodeKeywordChange(e.target.value.toUpperCase())}
            placeholder="代码"
            className="input-field h-7 w-24 px-2 font-mono text-xs"
            onKeyDown={(e) => { if (e.key === 'Enter') onApply() }}
          />
        )}

        <div className="inline-flex rounded border border-slate-200 p-0.5">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onPageSizeChange(size)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                pageSize === size ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <p className="min-w-0 flex-1 truncate text-[11px] text-slate-400">{criteriaLine}</p>

        <button type="button" onClick={onApply} className="btn-primary h-7 shrink-0 px-3 text-[11px]">
          <Search className="mr-1 inline h-3 w-3" />
          筛选
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={onReset} className="btn-secondary h-7 shrink-0 px-2.5 text-[11px]">
            重置
          </button>
        )}
      </div>
    </div>
  )
}

function buildCriteriaLine({
  activeTab,
  windowDays,
  activePeriod,
  appliedMinMarketCap,
  appliedMaxMarketCap,
}: {
  activeTab: QuantSignalTab
  windowDays: number
  activePeriod: string
  appliedMinMarketCap?: number
  appliedMaxMarketCap?: number
}) {
  let signal = ''
  if (activeTab === 'new_high') signal = `${windowDays}日新高`
  else if (activeTab === 'new_low') signal = `${windowDays}日新低`
  else signal = `${PERIOD_LABELS[activePeriod] ?? ''}新高`

  let cap = '市值不限'
  if (appliedMinMarketCap != null || appliedMaxMarketCap != null) {
    const min = appliedMinMarketCap != null ? formatMarketCapYi(appliedMinMarketCap) : '∞'
    const max = appliedMaxMarketCap != null ? formatMarketCapYi(appliedMaxMarketCap) : '∞'
    cap = `市值${min}~${max}`
  }

  return `${signal} · ${cap} · 流通市值=股本×收盘价`
}

export function ActiveFilterTags({
  activeTab,
  windowDays,
  activePeriod,
  appliedMinMarketCap,
  appliedMaxMarketCap,
  appliedCode,
}: {
  activeTab: QuantSignalTab
  windowDays: number
  activePeriod: string
  appliedMinMarketCap?: number
  appliedMaxMarketCap?: number
  appliedCode?: string
}) {
  const tags: string[] = []
  if (activeTab === 'new_high') tags.push(`${windowDays}日新高`)
  else if (activeTab === 'new_low') tags.push(`${windowDays}日新低`)
  else tags.push(`${PERIOD_LABELS[activePeriod]}新高`)

  if (appliedMinMarketCap != null || appliedMaxMarketCap != null) {
    const min = appliedMinMarketCap != null ? formatMarketCapYi(appliedMinMarketCap) : '∞'
    const max = appliedMaxMarketCap != null ? formatMarketCapYi(appliedMaxMarketCap) : '∞'
    tags.push(`${min}~${max}`)
  }
  if (appliedCode) tags.push(appliedCode)

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
          {tag}
        </span>
      ))}
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="shrink-0 text-[11px] font-medium text-slate-400">{label}</span>
      {children}
    </div>
  )
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
        active
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

export function panelTitle(tab: string, days: number, period: string) {
  if (tab === 'new_high') return `${days} 日新高`
  if (tab === 'new_low') return `${days} 日新低`
  return `${PERIOD_LABELS[period] ?? ''}新高`
}

export function panelDesc(tab: string, days: number) {
  if (tab === 'new_high') return `收盘价突破前 ${days} 日最高收盘价`
  if (tab === 'new_low') return `收盘价跌破前 ${days} 日最低收盘价`
  return '收盘价突破周期内前期最高收盘价'
}

export function defaultQuantSort(activeTab: QuantSignalTab): {
  sortBy: QuantSortField
  sortOrder: QuantSortOrder
} {
  return {
    sortBy: 'break_pct',
    sortOrder: activeTab === 'new_low' ? 'asc' : 'desc',
  }
}

export function nextQuantSort(
  field: QuantSortField,
  currentBy: QuantSortField,
  currentOrder: QuantSortOrder,
): { sortBy: QuantSortField; sortOrder: QuantSortOrder } {
  if (currentBy === field) {
    return { sortBy: field, sortOrder: currentOrder === 'asc' ? 'desc' : 'asc' }
  }
  return { sortBy: field, sortOrder: 'desc' }
}

export function SortableTh({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className = '',
}: {
  label: string
  field: QuantSortField
  sortBy: QuantSortField
  sortOrder: QuantSortOrder
  onSort: (field: QuantSortField) => void
  className?: string
}) {
  const active = sortBy === field
  return (
    <th className={`px-3 py-2 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-0.5 transition-colors ${
          active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {label}
        <span className="text-[10px] tabular-nums opacity-80">
          {active ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  )
}
