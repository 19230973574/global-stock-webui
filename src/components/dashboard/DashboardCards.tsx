import { cn } from '../../lib/utils'
import { EllipsisText } from '../ui/ellipsis-text'
import { CheckCircle2 } from 'lucide-react'

export type PermissionApp = {
  id: string
  name: string
  market: string
  description: string
  price: string
  features: string[]
  icon: React.ComponentType<{ className?: string }>
}

export function StatCard({
  title,
  value,
  icon: Icon,
  accent = 'blue',
  hint,
  className,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  accent?: 'blue' | 'green' | 'purple' | 'orange'
  hint?: string
  className?: string
}) {
  const accents = {
    blue: { icon: 'bg-blue-50 text-blue-600' },
    green: { icon: 'bg-emerald-50 text-emerald-600' },
    purple: { icon: 'bg-violet-50 text-violet-600' },
    orange: { icon: 'bg-orange-50 text-orange-600' },
  }
  const tone = accents[accent]

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <EllipsisText className="text-xs font-medium text-slate-500">{title}</EllipsisText>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
          {hint && <EllipsisText className="mt-1 text-[11px] text-slate-400">{hint}</EllipsisText>}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tone.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function PermissionAppCard({
  app,
  enabled,
  actionLabel,
  onAction,
  disabled = false,
  variant = 'marketplace',
}: {
  app: PermissionApp
  enabled: boolean
  actionLabel: string
  onAction: () => void
  disabled?: boolean
  variant?: 'marketplace' | 'admin'
}) {
  const Icon = app.icon
  const isAdmin = variant === 'admin'

  return (
    <div
      className={cn(
        'grid h-full grid-rows-[auto_auto_1fr_auto] rounded-xl border p-4',
        enabled ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', enabled ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-600')}>
          <Icon className="h-4 w-4" />
        </div>
        <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium', enabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>
          {enabled ? '已开通' : '未开通'}
        </span>
      </div>

      <div className="mt-3 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">{app.market}</p>
        <EllipsisText className="mt-0.5 text-sm font-semibold text-slate-900">{app.name}</EllipsisText>
        <EllipsisText lines={2} className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {app.description}
        </EllipsisText>
      </div>

      <div className="mt-2 flex flex-wrap gap-1 self-end">
        {app.features.slice(0, 3).map((f) => (
          <span key={f} className="max-w-full truncate rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
            {f}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-slate-100 pt-3">
        <EllipsisText className="text-sm font-bold text-slate-900">{app.price}</EllipsisText>
        <button
          onClick={onAction}
          disabled={disabled}
          className={cn(
            'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold',
            disabled && 'cursor-not-allowed bg-slate-100 text-slate-400',
            !disabled && enabled && isAdmin && 'bg-white text-rose-600 ring-1 ring-rose-200',
            !disabled && !(enabled && isAdmin) && !enabled && 'bg-blue-600 text-white',
            !disabled && enabled && !isAdmin && 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          )}
        >
          {enabled && !isAdmin && <CheckCircle2 className="mr-0.5 inline h-3 w-3" />}
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

export function PreviewMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
      <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate font-mono text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
      <span className="text-xs text-slate-500">{label}</span>
      <EllipsisText className="text-right text-xs font-medium text-slate-900">{value}</EllipsisText>
    </div>
  )
}
