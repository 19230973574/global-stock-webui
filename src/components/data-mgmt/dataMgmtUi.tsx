import type { LucideIcon } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

/** 与 AdminQuantDataPanel 一致的模块顶栏 */
export function DataMgmtPanelHeader({
  icon: Icon,
  title,
  subtitle,
  onRefresh,
  loading,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  onRefresh?: () => void
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="text-[11px] text-blue-100">{subtitle}</p>
        </div>
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-md bg-white/15 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-white/25 disabled:opacity-60"
        >
          <RefreshCw className={`mr-1 inline h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      )}
    </div>
  )
}

export function DataMgmtStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  )
}

export function DataMgmtStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{children}</div>
}

export function DataMgmtTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: T; label: string }>
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            active === tab.id
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export const dataMgmtInputClass = 'input-field mt-1 h-9 w-full text-sm'

export const dataMgmtTextareaClass = 'input-field mt-1 min-h-[72px] w-full resize-y text-sm'

export const dataMgmtLabelClass = 'text-xs text-slate-600'

/** 紧凑操作区：用于区间重建等工具栏式表单 */
export function DataMgmtActionCard({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-xs font-semibold text-slate-900">{title}</span>
        {hint && <span className="text-[10px] leading-snug text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export const dataMgmtCompactInputClass = 'input-field h-8 text-xs'

export const dataMgmtCompactFieldClass = 'block shrink-0'

export const dataMgmtCompactLabelClass = 'text-[10px] text-slate-500'
