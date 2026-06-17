import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  Database,
  HardDrive,
  Key,
  LayoutDashboard,
  LineChart,
  Settings,
  ShoppingCart,
  User,
  Users,
} from 'lucide-react'

export type DashboardMenuChild = {
  id: string
  label: string
}

export type DashboardMenuItem = {
  id: string
  label: string
  icon: LucideIcon
  children?: DashboardMenuChild[]
}

export const DASHBOARD_MENUS: DashboardMenuItem[] = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'marketplace', label: '数据采购', icon: ShoppingCart },
  { id: 'orders', label: '采购审核', icon: ClipboardList },
  { id: 'quant-data', label: '量化数据', icon: Database },
  {
    id: 'data-mgmt',
    label: '数据管理',
    icon: HardDrive,
    children: [
      { id: 'data-mgmt/stocks', label: '股票代码' },
      { id: 'data-mgmt/kline', label: 'K 线明细' },
      { id: 'data-mgmt/kline-dates', label: 'K 线日历' },
    ],
  },
  { id: 'accounts', label: '账号管理', icon: Users },
  { id: 'tokens', label: 'Token 管理', icon: Key },
  { id: 'quant', label: '量化专区', icon: LineChart },
  { id: 'profile', label: '个人中心', icon: User },
  { id: 'settings', label: '系统设置', icon: Settings },
]

export const DASHBOARD_ROUTE_IDS = new Set<string>(
  DASHBOARD_MENUS.flatMap((item) =>
    item.children ? item.children.map((child) => child.id) : [item.id],
  ),
)

export const DATA_MGMT_DEFAULT = 'data-mgmt/stocks'

export function dashboardPath(menuId: string) {
  return `/dashboard/${menuId}`
}

export function parseDashboardSection(pathname: string): string | null {
  const rest = pathname.replace(/^\/dashboard\/?/, '').split(/[?#]/)[0].replace(/\/$/, '')
  if (!rest) return null
  if (rest === 'data-mgmt') return DATA_MGMT_DEFAULT
  return DASHBOARD_ROUTE_IDS.has(rest) ? rest : null
}

export function resolveMenuTitle(menuId: string): string {
  for (const item of DASHBOARD_MENUS) {
    if (item.id === menuId) return item.label
    const child = item.children?.find((c) => c.id === menuId)
    if (child) return `${item.label} · ${child.label}`
  }
  return ''
}

export function isMenuActive(menuId: string, activeMenu: string): boolean {
  if (menuId === activeMenu) return true
  if (menuId === 'data-mgmt' && activeMenu.startsWith('data-mgmt/')) return true
  return false
}
