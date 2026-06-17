import { useEffect, useState } from 'react'
import { BarChart3, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { EllipsisText } from '../ui/ellipsis-text'
import { UserMenu } from './UserMenu'
import type { DashboardMenuItem } from '../../lib/dashboardMenus'
import { isMenuActive } from '../../lib/dashboardMenus'
import type { UserRole } from '../../lib/roles'

export function DashboardSidebar({
  menuItems,
  activeMenu,
  onMenuChange,
}: {
  menuItems: DashboardMenuItem[]
  activeMenu: string
  onMenuChange: (id: string) => void
}) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children?.some((child) => child.id === activeMenu)) {
        setExpandedGroups((prev) => ({ ...prev, [item.id]: true }))
      }
    })
  }, [activeMenu, menuItems])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <EllipsisText className="text-sm font-semibold text-slate-900">Global Stock</EllipsisText>
          <p className="text-[10px] text-slate-400">管理后台</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            if (item.children?.length) {
              const groupActive = isMenuActive(item.id, activeMenu)
              const expanded = expandedGroups[item.id] ?? groupActive
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.id)}
                    className={cn(
                      'flex w-full min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      groupActive
                        ? 'bg-blue-50 font-medium text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 shrink-0', groupActive ? 'text-blue-600' : 'text-slate-400')} />
                    <EllipsisText className="flex-1 text-left">{item.label}</EllipsisText>
                    <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
                  </button>
                  {expanded && (
                    <ul className="mt-0.5 space-y-0.5 border-l border-slate-100 ml-5 pl-2">
                      {item.children.map((child) => {
                        const childActive = activeMenu === child.id
                        return (
                          <li key={child.id}>
                            <button
                              type="button"
                              onClick={() => onMenuChange(child.id)}
                              className={cn(
                                'flex w-full min-w-0 items-center rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
                                childActive
                                  ? 'bg-blue-50 font-medium text-blue-700'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                              )}
                            >
                              <EllipsisText className="text-left">{child.label}</EllipsisText>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            }

            const active = activeMenu === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onMenuChange(item.id)}
                  className={cn(
                    'flex w-full min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-blue-50 font-medium text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-blue-600' : 'text-slate-400')} />
                  <EllipsisText className="flex-1 text-left">{item.label}</EllipsisText>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export function DashboardTopBar({
  title,
  userName,
  userEmail,
  role,
  onProfile,
  onLogout,
}: {
  title: string
  userName: string
  userEmail: string
  role: UserRole
  onProfile: () => void
  onLogout: () => void
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-5">
      <div className="content-container flex min-w-0 flex-1 items-center justify-between gap-4">
        <EllipsisText className="min-w-0 text-base font-semibold text-slate-900">
          {title}
        </EllipsisText>

        <UserMenu
          userName={userName}
          userEmail={userEmail}
          role={role}
          onProfile={onProfile}
          onLogout={onLogout}
        />
      </div>
    </header>
  )
}
