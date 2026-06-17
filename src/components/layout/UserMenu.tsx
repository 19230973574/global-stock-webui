import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import { EllipsisText } from '../ui/ellipsis-text'
import { Badge } from '../ui/badge'
import type { UserRole } from '../../lib/roles'

export function UserMenu({
  userName,
  userEmail,
  role,
  onProfile,
  onLogout,
}: {
  userName: string
  userEmail: string
  role: UserRole
  onProfile: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initials = userName.slice(0, 1).toUpperCase() || 'U'

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100',
          open && 'bg-slate-100'
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {initials}
        </div>
        <EllipsisText className="hidden max-w-[100px] text-sm font-medium text-slate-700 md:block">
          {userName}
        </EllipsisText>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500" title={userEmail}>
              {userEmail}
            </p>
            <div className="mt-2">
              <Badge variant="role" role={role} className="max-w-full" />
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onProfile()
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <User className="h-4 w-4 text-slate-400" />
            个人中心
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}
