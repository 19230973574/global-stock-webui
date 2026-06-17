import { cn } from '../../lib/utils'
import { ROLE_LABELS, type UserRole } from '../../lib/roles'

type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'role'

export function Badge({
  children,
  variant = 'neutral',
  role,
  surface = 'light',
  className,
}: {
  children?: React.ReactNode
  variant?: BadgeVariant
  role?: UserRole | string
  surface?: 'light' | 'dark'
  className?: string
}) {
  const roleLight =
    role === 'super_admin'
      ? 'bg-violet-50 text-violet-700 ring-violet-200/80'
      : role === 'admin'
        ? 'bg-sky-50 text-sky-700 ring-sky-200/80'
        : role === 'member'
          ? 'bg-slate-100 text-slate-600 ring-slate-200/80'
          : ''

  const roleDark =
    role === 'super_admin'
      ? 'badge-role-super'
      : role === 'admin'
        ? 'badge-role-admin'
        : role === 'member'
          ? 'badge-role-member'
          : ''

  return (
    <span
      className={cn(
        'badge max-w-full truncate',
        variant === 'success' && 'badge-success',
        variant === 'warning' && 'badge-warning',
        variant === 'info' && 'badge-info',
        variant === 'role' && (surface === 'dark' ? roleDark : roleLight),
        variant === 'neutral' && 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/60',
        className
      )}
      title={variant === 'role' && role ? ROLE_LABELS[role as UserRole] : undefined}
    >
      {variant === 'role' && role ? ROLE_LABELS[role as UserRole] ?? role : children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return <Badge variant="success">已激活</Badge>
  if (status === 'pending_activation') return <Badge variant="warning">待激活</Badge>
  if (status === 'disabled') return <Badge variant="neutral">已禁用</Badge>
  return <Badge variant="neutral">{status}</Badge>
}
