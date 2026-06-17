import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Calendar,
  Database,
  Key,
  RefreshCw,
  Shield,
  ShoppingCart,
} from 'lucide-react'
import type { AuthSession } from '../../lib/authApi'
import { fetchProducts, type DataProduct } from '../../lib/catalogApi'
import {
  fetchMySubscriptions,
  fetchMyUsage,
  type ApiUsage,
  type Subscription,
} from '../../lib/commerceApi'
import { permissionLabel } from '../../lib/permissions'
import { ROLE_LABELS, type UserRole } from '../../lib/roles'
import { Badge, StatusBadge } from '../ui/badge'
import { EllipsisText } from '../ui/ellipsis-text'
import { EmptyState, SectionCard } from '../ui/page-elements'

function formatDate(ts?: number) {
  if (!ts) return '永久有效'
  return new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function daysUntil(ts?: number) {
  if (!ts) return null
  return Math.ceil((ts - Date.now()) / (24 * 60 * 60 * 1000))
}

function subscriptionStatusLabel(status: string) {
  if (status === 'active') return '有效'
  if (status === 'expired') return '已过期'
  if (status === 'revoked') return '已撤销'
  return status
}

function subscriptionStatusVariant(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'active') return 'success'
  if (status === 'expired') return 'neutral'
  return 'warning'
}

export function ProfilePanel({
  user,
  onNavigate,
}: {
  user: AuthSession
  onNavigate: (id: string) => void
}) {
  const initials = user.name.slice(0, 1).toUpperCase()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [usage, setUsage] = useState<ApiUsage | null>(null)
  const [products, setProducts] = useState<DataProduct[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [subs, usageData, catalog] = await Promise.all([
        fetchMySubscriptions().catch(() => [] as Subscription[]),
        fetchMyUsage().catch(() => null),
        fetchProducts().catch(() => [] as DataProduct[]),
      ])
      setSubscriptions(subs)
      setUsage(usageData)
      setProducts(catalog)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active')
  const expiringSoon = activeSubscriptions.filter((s) => {
    const days = daysUntil(s.expiresAt)
    return days !== null && days >= 0 && days <= 7
  })

  const usagePercent = useMemo(() => {
    if (!usage || usage.unlimited || !usage.quotaMonthly) return null
    return Math.min(100, Math.round((usage.callCount / usage.quotaMonthly) * 100))
  }, [usage])

  const permissionsByGroup = useMemo(() => {
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]))
    return user.dataPermissions.reduce<Record<string, Array<{ id: string; name: string }>>>((acc, id) => {
      const product = productMap[id]
      const group = product?.group ?? '其他'
      if (!acc[group]) acc[group] = []
      acc[group].push({ id, name: product?.name ?? permissionLabel(id) })
      return acc
    }, {})
  }, [user.dataPermissions, products])

  const quickActions = [
    { id: 'marketplace', label: '数据采购', desc: '申请新数据权限', icon: ShoppingCart },
    { id: 'tokens', label: 'Token 管理', desc: '生成与管理 API 令牌', icon: Key },
  ]

  return (
    <div className="space-y-6">
      {/* 顶部身份卡片 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-8">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white ring-4 ring-white/30 backdrop-blur-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="mt-0.5 text-sm text-blue-100">{user.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="role" role={user.role as UserRole} surface="dark" />
                <StatusBadge status={user.status} />
              </div>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="relative shrink-0 self-start rounded-lg bg-white/15 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-60"
            >
              <RefreshCw className={`mr-1.5 inline h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <ProfileStat label="数据权限" value={user.dataPermissions.length} hint="已开通产品数" />
          <ProfileStat label="活跃订阅" value={activeSubscriptions.length} hint={expiringSoon.length > 0 ? `${expiringSoon.length} 项即将到期` : '有效订阅数'} />
          <ProfileStat
            label="本月 API"
            value={usage ? (usage.unlimited ? `${usage.callCount}` : `${usage.callCount}`) : '—'}
            hint={usage ? (usage.unlimited ? '无限额度' : `配额 ${usage.quotaMonthly}`) : '暂无数据'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧主内容 */}
        <div className="space-y-6 lg:col-span-2">
          {/* API 用量 */}
          <SectionCard title="API 用量" description={usage ? `${usage.usageMonth} 计费周期` : '本月调用统计'}>
            {!usage ? (
              <EmptyState icon={Activity} title="暂无用量数据" description="调用行情 API 后将在此显示" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold tabular-nums text-slate-900">{usage.callCount}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {usage.unlimited ? '本月调用次数（无限额度）' : `本月已用 / 配额 ${usage.quotaMonthly} 次`}
                    </p>
                  </div>
                  {usagePercent !== null && (
                    <span className={`text-sm font-semibold tabular-nums ${usagePercent >= 90 ? 'text-orange-600' : 'text-slate-600'}`}>
                      {usagePercent}%
                    </span>
                  )}
                </div>
                {!usage.unlimited && usage.quotaMonthly && (
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${usagePercent !== null && usagePercent >= 90 ? 'bg-orange-500' : 'bg-blue-600'}`}
                      style={{ width: `${usagePercent ?? 0}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* 我的订阅 */}
          <SectionCard
            title="我的订阅"
            description="采购审核通过后自动创建"
            action={
              activeSubscriptions.length === 0 ? (
                <button type="button" onClick={() => onNavigate('marketplace')} className="btn-primary h-8 px-3 text-xs">
                  去采购
                </button>
              ) : undefined
            }
          >
            {subscriptions.length === 0 ? (
              <EmptyState
                icon={Database}
                title="暂无订阅"
                description="提交采购申请并审核通过后，订阅将显示在这里"
                action={
                  <button type="button" onClick={() => onNavigate('marketplace')} className="btn-primary h-8 text-xs">
                    前往数据采购
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => {
                  const days = daysUntil(sub.expiresAt)
                  const expiring = sub.status === 'active' && days !== null && days >= 0 && days <= 7
                  return (
                    <div
                      key={sub.id}
                      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 ${
                        expiring ? 'border-orange-200 bg-orange-50/40' : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{sub.productName}</p>
                          <Badge variant={subscriptionStatusVariant(sub.status)}>
                            {subscriptionStatusLabel(sub.status)}
                          </Badge>
                          {expiring && (
                            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                              {days === 0 ? '今日到期' : `${days} 天后到期`}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(sub.expiresAt)}
                          </span>
                          {sub.grantedBy && <span>来源：{sub.grantedBy}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* 数据权限 */}
          <SectionCard
            title="已开通数据权限"
            description={`共 ${user.dataPermissions.length} 项`}
            action={
              user.dataPermissions.length === 0 ? undefined : (
                <button type="button" onClick={() => onNavigate('tokens')} className="btn-secondary h-8 px-3 text-xs">
                  管理 Token
                </button>
              )
            }
          >
            {user.dataPermissions.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="暂无数据权限"
                description="开通数据权限后即可调用行情 API"
                action={
                  <button type="button" onClick={() => onNavigate('marketplace')} className="btn-primary h-8 text-xs">
                    前往采购
                  </button>
                }
              />
            ) : (
              <div className="space-y-4">
                {Object.entries(permissionsByGroup).map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* 右侧边栏 */}
        <div className="space-y-6">
          <SectionCard title="账号信息">
            <dl className="space-y-3">
              <AccountField label="姓名" value={user.name} />
              <AccountField label="邮箱" value={user.email} />
              <AccountField label="系统角色" value={ROLE_LABELS[user.role as UserRole] ?? user.role} />
              <AccountField
                label="账号状态"
                value={
                  user.status === 'active' ? '已激活'
                    : user.status === 'disabled' ? '已禁用'
                      : user.status === 'pending_activation' ? '待激活'
                        : user.status
                }
              />
            </dl>
          </SectionCard>

          <SectionCard title="快捷入口" description="常用功能">
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onNavigate(action.id)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-left transition-all hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-slate-100 group-hover:bg-blue-600 group-hover:text-white">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-500">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </SectionCard>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">权限说明</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  数据权限通过采购或管理员开通后生效。API 调用时系统会实时校验订阅状态与配额，Token 仅作身份凭证。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileStat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="px-6 py-4 text-center sm:text-left">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <EllipsisText className="mt-0.5 text-[11px] text-slate-400">{hint}</EllipsisText>
    </div>
  )
}

function AccountField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
      <dt className="shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-xs font-medium text-slate-900">{value}</dd>
    </div>
  )
}
