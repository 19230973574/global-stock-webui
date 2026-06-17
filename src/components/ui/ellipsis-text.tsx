import { cn } from '../../lib/utils'

export function EllipsisText({
  children,
  className,
  title,
  lines = 1,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  lines?: 1 | 2
}) {
  const text = typeof children === 'string' ? children : undefined
  return (
    <span
      title={title ?? text}
      className={cn(
        'block min-w-0',
        lines === 1 && 'truncate',
        lines === 2 && 'line-clamp-2',
        className
      )}
    >
      {children}
    </span>
  )
}
