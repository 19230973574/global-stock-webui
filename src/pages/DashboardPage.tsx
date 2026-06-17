import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { OrderReviewPanel } from '../components/commerce/OrderReviewPanel'
import { DataMarketplacePanel } from '../components/commerce/DataMarketplacePanel'
import { AccountManagement } from '../components/accounts/AccountManagement'
import { ProfilePanel } from '../components/profile/ProfilePanel'
import { TokenManagementPanel } from '../components/tokens/TokenManagementPanel'
import { QuantZonePanel } from '../components/quant/QuantZonePanel'
import { AdminQuantDataPanel } from '../components/quant/AdminQuantDataPanel'
import { AdminUsKlinePanel } from '../components/data-mgmt/AdminUsKlinePanel'
import { AdminUsKlineDatesPanel } from '../components/data-mgmt/AdminUsKlineDatesPanel'
import { AdminUsStockPanel } from '../components/data-mgmt/AdminUsStockPanel'
import { DashboardSidebar, DashboardTopBar } from '../components/layout/DashboardSidebar'
import { StatCard } from '../components/dashboard/DashboardCards'
import { type PermissionId } from '../lib/permissions'
import { LoadingScreen, SectionCard } from '../components/ui/page-elements'
import { EllipsisText } from '../components/ui/ellipsis-text'
import {
  fetchCurrentProfile,
  fetchDashboardStats,
  fetchUsers,
  grantDataPermission,
  logoutSession,
  revokeDataPermission,
  updateUserRole,
  type AuthSession,
  type DashboardStats,
  type UserAccount,
} from '../lib/authApi'
import { updateUserStatus } from '../lib/adminApi'
import { canAccessMenu, hasRoleAtLeast, ROLE_OPTIONS, type UserRole } from '../lib/roles'
import { clearSession, getSessionUser } from '../lib/session'
import {
  DASHBOARD_MENUS,
  dashboardPath,
  parseDashboardSection,
  resolveMenuTitle,
} from '../lib/dashboardMenus'
import {
  Activity,
  ClipboardList,
  Clock,
  Database,
  HardDrive,
  Key,
  LineChart,
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  User,
  Users,
} from 'lucide-react'

function defaultMenuForRole(role: UserRole) {
  return hasRoleAtLeast(role, 'admin') ? 'dashboard' : 'marketplace'
}

function isMenuAllowed(
  menuItems: typeof DASHBOARD_MENUS,
  pathMenu: string,
) {
  return menuItems.some((item) =>
    item.id === pathMenu || item.children?.some((child) => child.id === pathMenu),
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathMenu = parseDashboardSection(location.pathname)
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(getSessionUser())
  const [users, setUsers] = useState<UserAccount[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const role = (currentUser?.role ?? 'member') as UserRole
  const menuItems = DASHBOARD_MENUS.filter((item) => {
    if (item.id === 'quant') {
      return currentUser?.dataPermissions?.includes('us_quant_zone') ?? false
    }
    return canAccessMenu(role, item.id)
  })

  const activeMenu = pathMenu ?? defaultMenuForRole(role)

  const navigateMenu = useCallback((menuId: string) => {
    navigate(dashboardPath(menuId))
  }, [navigate])

  useEffect(() => {
    if (loading || !currentUser) return

    const onDashboardRoot = location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    const fallback = defaultMenuForRole(role)

    if (onDashboardRoot || !pathMenu) {
      navigate(dashboardPath(fallback), { replace: true })
      return
    }

    if (/^\/dashboard\/data-mgmt\/?$/.test(location.pathname)) {
      navigate(dashboardPath('data-mgmt/stocks'), { replace: true })
      return
    }

    if (!canAccessMenu(role, pathMenu)) {
      navigate(dashboardPath(fallback), { replace: true })
      return
    }

    if (!isMenuAllowed(menuItems, pathMenu)) {
      navigate(dashboardPath(fallback), { replace: true })
    }
  }, [loading, currentUser, location.pathname, pathMenu, role, menuItems, navigate])

  const refreshProfile = useCallback(async () => {
    const profile = await fetchCurrentProfile()
    setCurrentUser(profile)
    return profile
  }, [])

  const refreshUsers = useCallback(async () => {
    if (!hasRoleAtLeast(role, 'admin')) return
    const list = await fetchUsers()
    setUsers(list)
  }, [role])

  const refreshStats = useCallback(async () => {
    if (!hasRoleAtLeast(role, 'admin')) return
    setStats(await fetchDashboardStats())
  }, [role])

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await refreshProfile()
        const userRole = (profile.role ?? 'member') as UserRole
        const onDashboardRoot = location.pathname === '/dashboard' || location.pathname === '/dashboard/'
        if (onDashboardRoot || !parseDashboardSection(location.pathname)) {
          navigate(dashboardPath(defaultMenuForRole(userRole)), { replace: true })
        }
        await Promise.all([refreshUsers(), refreshStats()])
      } catch {
        clearSession()
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [location.pathname, navigate, refreshProfile, refreshStats, refreshUsers])

  const currentAccount: UserAccount = useMemo(
    () => ({
      email: currentUser?.email ?? '',
      name: currentUser?.name ?? '',
      status: currentUser?.status ?? 'active',
      role: currentUser?.role ?? 'member',
      dataPermissions: currentUser?.dataPermissions ?? [],
    }),
    [currentUser]
  )

  const handleLogout = async () => {
    try { await logoutSession() } catch { /* ignore */ }
    clearSession()
    navigate('/login')
  }

  const handleGrantPermission = async (email: string, permission: PermissionId) => {
    await grantDataPermission({ email, permission })
    await refreshProfile()
    await refreshUsers()
  }

  const handleRevokePermission = async (email: string, permission: PermissionId) => {
    await revokeDataPermission({ email, permission })
    await refreshProfile()
    await refreshUsers()
  }

  if (loading || !currentUser) return <LoadingScreen />

  const activeLabel = resolveMenuTitle(activeMenu)

  return (
    <div className="h-screen overflow-hidden bg-[#f1f5f9]">
      <DashboardSidebar
        menuItems={menuItems}
        activeMenu={activeMenu}
        onMenuChange={navigateMenu}
      />

      <div className="ml-[220px] flex h-screen min-w-0 flex-col">
        <DashboardTopBar
          title={activeLabel}
          userName={currentUser.name}
          userEmail={currentUser.email}
          role={role}
          onProfile={() => navigateMenu('profile')}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 px-5 py-4">
          <div className="content-container space-y-5">
          {activeMenu === 'dashboard' && hasRoleAtLeast(role, 'admin') && (
            <DashboardOverview stats={stats} onNavigate={navigateMenu} />
          )}
          {activeMenu === 'marketplace' && (
            <DataMarketplacePanel
              account={currentAccount}
              role={role}
              onRefreshProfile={refreshProfile}
              onNavigate={navigateMenu}
            />
          )}
          {activeMenu === 'orders' && hasRoleAtLeast(role, 'admin') && (
            <OrderReviewPanel onChanged={async () => {
              await Promise.all([refreshUsers(), refreshStats(), refreshProfile()])
            }} />
          )}
          {activeMenu === 'quant-data' && hasRoleAtLeast(role, 'admin') && (
            <AdminQuantDataPanel />
          )}
          {activeMenu === 'data-mgmt/stocks' && hasRoleAtLeast(role, 'admin') && (
            <AdminUsStockPanel />
          )}
          {activeMenu === 'data-mgmt/kline' && hasRoleAtLeast(role, 'admin') && (
            <AdminUsKlinePanel />
          )}
          {activeMenu === 'data-mgmt/kline-dates' && hasRoleAtLeast(role, 'admin') && (
            <AdminUsKlineDatesPanel />
          )}
          {activeMenu === 'accounts' && hasRoleAtLeast(role, 'admin') && (
            <AccountManagement
              users={users}
              currentRole={role}
              onRefresh={refreshUsers}
              onGrant={handleGrantPermission}
              onRevoke={handleRevokePermission}
              onUpdateRole={async (email, newRole) => { await updateUserRole(email, newRole); await refreshUsers() }}
              onUpdateStatus={role === 'super_admin' ? async (email, status) => {
                const updated = await updateUserStatus(email, status)
                setUsers((prev) => prev.map((u) => (u.email === email ? updated : u)))
              } : undefined}
            />
          )}
          {activeMenu === 'tokens' && (
            <TokenManagementPanel account={currentAccount} onNavigate={navigateMenu} />
          )}
          {activeMenu === 'quant' && (
            <QuantZonePanel
              account={currentAccount}
              onRefreshProfile={refreshProfile}
              onNavigate={navigateMenu}
            />
          )}
          {activeMenu === 'profile' && <ProfilePanel user={currentUser} onNavigate={navigateMenu} />}
          {activeMenu === 'settings' && hasRoleAtLeast(role, 'super_admin') && (
            <SettingsPanel users={users} onRefresh={refreshUsers} />
          )}
          </div>
        </main>
      </div>
    </div>
  )
}

function DashboardOverview({ stats, onNavigate }: { stats: DashboardStats | null; onNavigate: (id: string) => void }) {
  const actions = [
    { id: 'orders', label: '采购审核', icon: ClipboardList, desc: '待审核订单' },
    { id: 'quant-data', label: '量化数据', icon: LineChart, desc: '美股新高新低' },
    { id: 'data-mgmt/stocks', label: '股票代码', icon: HardDrive, desc: '美股标的列表' },
    { id: 'data-mgmt/kline', label: 'K 线明细', icon: HardDrive, desc: '验数与补数任务' },
    { id: 'data-mgmt/kline-dates', label: 'K 线日历', icon: HardDrive, desc: '区间重建与交易日浏览' },
    { id: 'accounts', label: '账号管理', icon: Users, desc: '用户与权限' },
    { id: 'marketplace', label: '数据采购', icon: ShoppingCart, desc: '开通数据应用' },
    { id: 'tokens', label: 'Token', icon: Key, desc: 'API 令牌' },
    { id: 'settings', label: '系统设置', icon: Settings, desc: '角色配置' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="总用户数" value={stats?.totalUsers ?? 0} icon={Users} accent="blue" hint="平台注册总量" className="stagger-1" />
        <StatCard title="待审核" value={stats?.pendingOrders ?? 0} icon={ClipboardList} accent="orange" hint="采购申请待处理" className="stagger-2" />
        <StatCard title="活跃订阅" value={stats?.activeSubscriptions ?? 0} icon={Database} accent="green" hint="有效数据订阅" className="stagger-3" />
        <StatCard title="本月 API 调用" value={stats?.monthlyApiCalls ?? 0} icon={Activity} accent="purple" hint="全平台调用量" className="stagger-4" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard title="活跃账号" value={stats?.activeUsers ?? 0} icon={ShieldCheck} accent="green" hint="已激活用户" />
        <StatCard title="活跃 Token" value={stats?.activeTokens ?? 0} icon={Key} accent="purple" hint="有效 API 令牌" />
        <StatCard title="即将到期" value={stats?.expiringSoon ?? 0} icon={Clock} accent="orange" hint="7 天内到期订阅" />
      </div>

      <SectionCard title="快捷操作" description="常用管理功能一键直达">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {actions.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="group flex flex-col items-start rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-slate-900">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function SettingsPanel({ users, onRefresh }: { users: UserAccount[]; onRefresh: () => Promise<void> }) {
  const roleCounts = ROLE_OPTIONS.map((opt) => ({
    ...opt,
    count: users.filter((u) => u.role === opt.value).length,
  }))

  const roleDetails = [
    { role: 'super_admin' as UserRole, icon: Shield, color: 'from-violet-500 to-purple-600', desc: '管理全部用户、分配角色、开通/撤销任意账号的数据权限' },
    { role: 'admin' as UserRole, icon: Users, color: 'from-blue-500 to-cyan-500', desc: '创建普通成员、管理成员的数据权限与 Token' },
    { role: 'member' as UserRole, icon: User, color: 'from-slate-500 to-slate-600', desc: '提交采购申请、等待审核通过后使用数据、管理自己的 Token' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {roleCounts.map((item, i) => (
          <StatCard key={item.value} title={item.label} value={item.count} icon={Shield} accent={(['purple', 'blue', 'orange'] as const)[i]} hint="当前人数" />
        ))}
      </div>

      <SectionCard
        title="角色权限说明"
        description="三级权限体系：超级系统管理员 > 管理员 > 普通成员"
        action={<button onClick={onRefresh} className="btn-secondary h-9 text-xs"><RefreshCw className="mr-1 h-3 w-3" />刷新</button>}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {roleDetails.map((item) => (
            <div key={item.role} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} text-white`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <Badge variant="role" role={item.role} className="max-w-full" />
              </div>
              <EllipsisText lines={2} className="text-xs leading-relaxed text-slate-600">{item.desc}</EllipsisText>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
