import { cn } from '../../lib/utils'
import { EllipsisText } from './ellipsis-text'

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  noPadding,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {(title || action) && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && <EllipsisText className="text-sm font-semibold text-slate-900">{title}</EllipsisText>}
            {description && <EllipsisText className="mt-0.5 text-xs text-slate-500">{description}</EllipsisText>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function AlertBanner({
  type,
  message,
}: {
  type: 'error' | 'success' | 'info'
  message: string
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  }
  return (
    <p className={cn('rounded-lg border px-3 py-2.5 text-sm', styles[type])}>{message}</p>
  )
}

export function LoadingScreen({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
