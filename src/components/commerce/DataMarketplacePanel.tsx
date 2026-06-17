import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  BookOpen,
  Clock,
  Database,
  Key,
  Package,
  RefreshCw,
  ScrollText,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import type { UserAccount } from '../../lib/authApi'
import { fetchBundles, fetchProducts, type DataProduct, type ProductBundle } from '../../lib/catalogApi'
import {
  createBundleOrder,
  createPurchaseOrder,
  fetchMyOrders,
  orderPermissionLabel,
  type PurchaseOrder,
} from '../../lib/commerceApi'
import { type PermissionId } from '../../lib/permissions'
import { hasRoleAtLeast, type UserRole } from '../../lib/roles'
import { OrderStatusBadge } from './OrderReviewPanel'
import { PermissionAppCard, type PermissionApp } from '../dashboard/DashboardCards'
import { EllipsisText } from '../ui/ellipsis-text'
import { AlertBanner, EmptyState, SectionCard } from '../ui/page-elements'

type MarketplaceTab = 'products' | 'bundles' | 'orders' | 'guide'

const GROUP_ORDER = ['美股', 'A股', 'ETF', '量化专区'] as const

function productIcon(id: string) {
  if (id.includes('history')) return Clock
  if (id.includes('timeshare')) return BarChart3
  if (id.startsWith('a')) return Activity
  if (id.startsWith('etf')) return Database
  return Activity
}

function toPermissionApps(products: DataProduct[]): PermissionApp[] {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    market: p.group,
    description: p.description,
    price: p.priceDisplay,
    features: [`${p.periodMonths} 个月`, p.apiQuotaMonthly ? `${p.apiQuotaMonthly} 次/月` : '无限调用'],
    icon: productIcon(p.id),
  }))
}

function toBundleApps(bundles: ProductBundle[]): PermissionApp[] {
  return bundles.map((b) => ({
    id: `bundle:${b.id}`,
    name: b.name,
    market: b.popular ? '推荐套餐' : '数据套餐',
    description: b.description,
    price: b.priceDisplay,
    features: [
      `${b.productIds.length} 项数据权限`,
      b.apiQuotaMonthly ? `${b.apiQuotaMonthly} 次/月` : '无限调用',
    ],
    icon: Package,
  }))
}

function formatOrderTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DataMarketplacePanel({
  account,
  role,
  onRefreshProfile,
  onNavigate,
}: {
  account: UserAccount
  role: UserRole
  onRefreshProfile: () => Promise<unknown>
  onNavigate: (id: string) => void
}) {
  const [products, setProducts] = useState<DataProduct[]>([])
  const [bundles, setBundles] = useState<ProductBundle[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseError, setPurchaseError] = useState('')
  const [purchaseSuccess, setPurchaseSuccess] = useState('')
  const [submitting, setSubmitting] = useState('')
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('products')
  const [productGroup, setProductGroup] = useState<string>('all')

  const permissionApps = useMemo(() => toPermissionApps(products), [products])
  const bundleApps = useMemo(() => toBundleApps(bundles), [bundles])
  const bundleNames = useMemo(
    () => Object.fromEntries(bundles.map((b) => [b.id, b.name])),
    [bundles]
  )

  const productsByGroup = useMemo(() => {
    return permissionApps.reduce<Record<string, PermissionApp[]>>((acc, app) => {
      if (!acc[app.market]) acc[app.market] = []
      acc[app.market].push(app)
      return acc
    }, {})
  }, [permissionApps])

  const productGroups = useMemo(() => {
    const keys = Object.keys(productsByGroup)
    return [
      ...GROUP_ORDER.filter((g) => keys.includes(g)),
      ...keys.filter((g) => !GROUP_ORDER.includes(g as (typeof GROUP_ORDER)[number])),
    ]
  }, [productsByGroup])

  const visibleProducts = useMemo(() => {
    if (productGroup === 'all') return permissionApps
    return productsByGroup[productGroup] ?? []
  }, [productGroup, permissionApps, productsByGroup])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [productList, bundleList, orderList] = await Promise.all([
        fetchProducts().catch(() => [] as DataProduct[]),
        fetchBundles().catch(() => [] as ProductBundle[]),
        fetchMyOrders().catch(() => [] as PurchaseOrder[]),
      ])
      setProducts(productList)
      setBundles(bundleList)
      setOrders(orderList)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const pendingPermissions = useMemo(
    () => new Set(orders.filter((o) => o.status === 'pending_review').map((o) => o.permission)),
    [orders]
  )

  const pendingCount = orders.filter((o) => o.status === 'pending_review').length
  const availableCount = permissionApps.filter((p) => !account.dataPermissions.includes(p.id as PermissionId)).length

  const handleSubmitOrder = async (permissionId: string, label: string) => {
    setPurchaseError('')
    setPurchaseSuccess('')
    setSubmitting(permissionId)
    try {
      const order = permissionId.startsWith('bundle:')
        ? await createBundleOrder(permissionId.slice('bundle:'.length))
        : await createPurchaseOrder(permissionId)
      setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)])
      await onRefreshProfile()
      if (order.status === 'approved') {
        setPurchaseSuccess(`${label} 已开通`)
        if (permissionId === 'us_quant_zone') {
          onNavigate('quant')
        }
      } else {
        setPurchaseSuccess(`${label} 申请已提交，等待管理员审核`)
        setActiveTab('orders')
      }
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting('')
    }
  }

  const renderProductCard = (app: PermissionApp) => {
    const purchased = account.dataPermissions.includes(app.id as PermissionId)
    const pending = pendingPermissions.has(app.id)
    const actionLabel = purchased
      ? '已开通'
      : pending
        ? '审核中'
        : submitting === app.id
          ? '提交中'
          : '申请采购'
    return (
      <PermissionAppCard
        key={app.id}
        app={app}
        enabled={purchased}
        actionLabel={actionLabel}
        disabled={purchased || pending || submitting === app.id}
        onAction={async () => { await handleSubmitOrder(app.id, app.name) }}
      />
    )
  }

  const tabs: Array<{ id: MarketplaceTab; label: string; icon: typeof Database; badge?: number }> = [
    { id: 'products', label: '数据产品', icon: Database },
    { id: 'bundles', label: '数据套餐', icon: Package, badge: bundleApps.length || undefined },
    { id: 'orders', label: '采购记录', icon: ScrollText, badge: pendingCount || undefined },
    { id: 'guide', label: '使用指南', icon: BookOpen },
  ]

  return (
    <div className="space-y-4">
      {/* 顶部概览 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 py-5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-4 ring-white/25 backdrop-blur-sm">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">数据采购</h2>
                <p className="mt-0.5 text-xs text-blue-100">
                  {hasRoleAtLeast(role, 'admin')
                    ? '管理员自助采购自动开通'
                    : '提交申请，审核通过后即可使用'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="shrink-0 self-start rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-60"
            >
              <RefreshCw className={`mr-1.5 inline h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <MarketStat label="已开通" value={account.dataPermissions.length} hint="当前有效权限" />
          <MarketStat label="待审核" value={pendingCount} hint="采购申请处理中" />
          <MarketStat label="可采购" value={availableCount} hint="尚未开通的产品" />
        </div>
      </div>

      {purchaseError && <AlertBanner type="error" message={purchaseError} />}
      {purchaseSuccess && <AlertBanner type="success" message={purchaseSuccess} />}

      {/* Tab 导航 + 内容区 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 pt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white text-blue-700 shadow-[0_-1px_0_0_#fff,inset_0_-2px_0_0_#2563eb]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums ${
                    active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="p-4">
          {activeTab === 'products' && (
            <div className="space-y-4">
              {productGroups.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400">市场</span>
                  <GroupChip active={productGroup === 'all'} onClick={() => setProductGroup('all')}>
                    全部
                  </GroupChip>
                  {productGroups.map((group) => (
                    <GroupChip
                      key={group}
                      active={productGroup === group}
                      onClick={() => setProductGroup(group)}
                    >
                      {group}
                      <span className="ml-1 opacity-70">{productsByGroup[group]?.length ?? 0}</span>
                    </GroupChip>
                  ))}
                </div>
              )}

              {visibleProducts.length === 0 && !loading ? (
                <EmptyState icon={Database} title="暂无产品" description="产品目录加载失败或该分类下无产品" />
              ) : (
                <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {visibleProducts.map(renderProductCard)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bundles' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">组合采购，审核通过后批量开通；已开通项不会重复计费。</p>
              {bundleApps.length === 0 && !loading ? (
                <EmptyState icon={Package} title="暂无套餐" description="套餐目录加载失败或为空" />
              ) : (
                <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {bundleApps.map((app) => {
                    const bundle = bundles.find((b) => `bundle:${b.id}` === app.id)
                    const ownedCount = bundle?.productIds.filter((id) => account.dataPermissions.includes(id)).length ?? 0
                    const totalCount = bundle?.productIds.length ?? 0
                    const fullyOwned = totalCount > 0 && ownedCount === totalCount
                    const partiallyOwned = ownedCount > 0 && ownedCount < totalCount
                    const pending = pendingPermissions.has(app.id)
                    const bundleApp = partiallyOwned
                      ? { ...app, features: [`已开通 ${ownedCount}/${totalCount} 项`, ...app.features.slice(0, 1)] }
                      : app
                    const actionLabel = fullyOwned
                      ? '已全部开通'
                      : pending
                        ? '审核中'
                        : submitting === app.id
                          ? '提交中'
                          : partiallyOwned
                            ? '补购套餐'
                            : '申请套餐'
                    return (
                      <div key={app.id} className="relative">
                        {bundle?.popular && (
                          <span className="absolute -right-1 -top-2 z-10 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                            推荐
                          </span>
                        )}
                        <PermissionAppCard
                          app={bundleApp}
                          enabled={fullyOwned}
                          actionLabel={actionLabel}
                          disabled={fullyOwned || pending || submitting === app.id}
                          onAction={async () => { await handleSubmitOrder(app.id, app.name) }}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 && !loading ? (
                <EmptyState
                  icon={ScrollText}
                  title="暂无采购记录"
                  description="提交数据产品或套餐申请后，记录将显示在这里"
                  action={
                    <button type="button" className="btn-primary h-8 text-xs" onClick={() => setActiveTab('products')}>
                      浏览数据产品
                    </button>
                  }
                />
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">
                          {orderPermissionLabel(order.permission, bundleNames)}
                        </p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">{order.orderNo}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{formatOrderTime(order.submittedAt)}</p>
                      {(order.rejectReason || order.reviewedBy) && (
                        <p className="mt-0.5 max-w-[240px] truncate">{order.rejectReason || order.reviewedBy}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="采购流程">
                <ol className="space-y-4">
                  {[
                    { step: '1', title: '选择产品', desc: '在「数据产品」或「数据套餐」中挑选所需权限' },
                    { step: '2', title: '提交申请', desc: hasRoleAtLeast(role, 'admin') ? '管理员自动开通' : '等待管理员审核' },
                    { step: '3', title: '生成 Token', desc: '在 Token 管理中创建 API 令牌' },
                    { step: '4', title: '调用 API', desc: '携带 X-API-Token 请求行情数据' },
                    { step: '5', title: '量化专区', desc: '申请「美股量化专区」后可使用新高新低筛选' },
                  ].map((item) => (
                    <li key={item.step} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {item.step}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  onClick={() => onNavigate('tokens')}
                  className="btn-secondary mt-4 h-9 w-full text-xs"
                >
                  <Key className="mr-1.5 inline h-3.5 w-3.5" />
                  前往 Token 管理
                </button>
              </SectionCard>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">温馨提示</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        套餐内已开通的权限不会重复计费，补购套餐仅开通剩余项。权限生效后请至 Token 管理生成令牌。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-900">快捷入口</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary h-8 text-xs" onClick={() => setActiveTab('products')}>
                      浏览数据产品
                    </button>
                    <button type="button" className="btn-secondary h-8 text-xs" onClick={() => setActiveTab('bundles')}>
                      查看套餐
                    </button>
                    <button type="button" className="btn-secondary h-8 text-xs" onClick={() => onNavigate('tokens')}>
                      Token 管理
                    </button>
                    {account.dataPermissions.includes('us_quant_zone') && (
                      <button type="button" className="btn-secondary h-8 text-xs" onClick={() => onNavigate('quant')}>
                        量化专区
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GroupChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
        active
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function MarketStat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="px-4 py-3 text-center sm:text-left">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{value}</p>
      <EllipsisText className="mt-0.5 text-[11px] text-slate-400">{hint}</EllipsisText>
    </div>
  )
}
