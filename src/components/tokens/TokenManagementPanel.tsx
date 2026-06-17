import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Check,
  Copy,
  Key,
  Plus,
  RefreshCw,
  Shield,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import type { UserAccount } from '../../lib/authApi'
import { fetchProducts, type DataProduct } from '../../lib/catalogApi'
import { fetchMyUsage, type ApiUsage } from '../../lib/commerceApi'
import { permissionLabel } from '../../lib/permissions'
import {
  fetchTokenUsage,
  generateToken,
  listTokens,
  refreshTokenPermissions,
  revokeToken,
  type ApiToken,
} from '../../lib/tokenApi'
import { fetchHistoryBars, fetchIntradayBars, fetchQuote, type KlineBar, type Quote } from '../../lib/marketApi'
import { PreviewMetric } from '../dashboard/DashboardCards'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { EllipsisText } from '../ui/ellipsis-text'
import { AlertBanner, EmptyState, SectionCard } from '../ui/page-elements'

function formatDateTime(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('zh-CN')
}

function tokenStatusLabel(status: string) {
  if (status === 'active') return '有效'
  if (status === 'revoked') return '已吊销'
  return status
}

export function TokenManagementPanel({
  account,
  onNavigate,
}: {
  account: UserAccount
  onNavigate: (id: string) => void
}) {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [usageMap, setUsageMap] = useState<Record<string, number>>({})
  const [accountUsage, setAccountUsage] = useState<ApiUsage | null>(null)
  const [products, setProducts] = useState<DataProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newTokenId, setNewTokenId] = useState<string | null>(null)
  const [previewCode, setPreviewCode] = useState('AAPL')
  const [previewTokenId, setPreviewTokenId] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [intradayBars, setIntradayBars] = useState<KlineBar[]>([])
  const [historyBars, setHistoryBars] = useState<KlineBar[]>([])
  const [previewError, setPreviewError] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const productNames = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [list, usage, catalog] = await Promise.all([
        listTokens(),
        fetchMyUsage().catch(() => null),
        fetchProducts().catch(() => [] as DataProduct[]),
      ])
      setTokens(list)
      setAccountUsage(usage)
      setProducts(catalog)

      const usageEntries = await Promise.all(
        list.filter((t) => t.status === 'active').map(async (t) => {
          try {
            const u = await fetchTokenUsage(t.id)
            return [t.id, u.callCount] as const
          } catch {
            return [t.id, 0] as const
          }
        })
      )
      setUsageMap(Object.fromEntries(usageEntries))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const activeTokens = useMemo(() => tokens.filter((t) => t.status === 'active'), [tokens])

  useEffect(() => {
    if (activeTokens.length === 0) return
    const selected = activeTokens.find((t) => t.id === previewTokenId)
    if (!selected) {
      const first = activeTokens[0]
      setPreviewTokenId(first.id)
      setApiToken(first.token)
    }
  }, [activeTokens, previewTokenId])

  const handleSelectPreviewToken = (tokenId: string) => {
    setPreviewTokenId(tokenId)
    const token = activeTokens.find((t) => t.id === tokenId)
    if (token) setApiToken(token.token)
  }

  const handleLoadPreview = async () => {
    setPreviewLoading(true)
    setPreviewError('')
    try {
      if (!apiToken.trim()) throw new Error('请选择或填写 API Token')
      const token = apiToken.trim()
      const [q, i, h] = await Promise.all([
        fetchQuote(previewCode, 'US', token),
        fetchIntradayBars(previewCode, 'US', '1m', 60, token),
        fetchHistoryBars(previewCode, 'US', '1d', 60, token),
      ])
      setQuote(q)
      setIntradayBars(i)
      setHistoryBars(h)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setPreviewLoading(false)
    }
  }
  const revokedTokens = tokens.filter((t) => t.status !== 'active')
  const totalTokenUsage = Object.values(usageMap).reduce((sum, n) => sum + n, 0)

  const handleCopy = async (tokenId: string, token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      setCopiedId(tokenId)
      window.setTimeout(() => setCopiedId((id) => (id === tokenId ? null : id)), 2000)
    } catch {
      setError('复制失败，请手动选择复制')
    }
  }

  const handleGenerate = async () => {
    if (account.dataPermissions.length === 0) {
      setError('请先在数据采购中开通数据权限')
      return
    }
    setBusyId('generate')
    setError('')
    try {
      const token = await generateToken()
      setTokens((c) => [token, ...c])
      setNewTokenId(token.id)
      setPreviewTokenId(token.id)
      setApiToken(token.token)
      setUsageMap((m) => ({ ...m, [token.id]: 0 }))
      await handleCopy(token.id, token.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setBusyId(null)
    }
  }

  const handleRevoke = async (tokenId: string) => {
    setBusyId(tokenId)
    setError('')
    try {
      await revokeToken(tokenId)
      if (newTokenId === tokenId) setNewTokenId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '吊销失败')
    } finally {
      setBusyId(null)
    }
  }

  const handleRefreshPermissions = async (tokenId: string) => {
    setBusyId(tokenId)
    setError('')
    try {
      await refreshTokenPermissions(tokenId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '同步失败')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* 顶部概览 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-8">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-4 ring-white/25 backdrop-blur-sm">
                <Key className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">API Token</h2>
                <p className="mt-0.5 text-sm text-blue-100">
                  调用行情接口时在请求头携带 <code className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-xs">X-API-Token</code>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="rounded-lg bg-white/15 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-60"
              >
                <RefreshCw className={`mr-1.5 inline h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || busyId === 'generate' || account.dataPermissions.length === 0}
                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 disabled:opacity-60"
              >
                <Plus className="mr-1.5 inline h-3.5 w-3.5" />
                {busyId === 'generate' ? '生成中…' : '生成 Token'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <TokenStat label="有效 Token" value={activeTokens.length} hint="可用于 API 调用" />
          <TokenStat label="已绑定权限" value={account.dataPermissions.length} hint="当前账号数据权限" />
          <TokenStat
            label="本月调用"
            value={accountUsage?.callCount ?? totalTokenUsage}
            hint={accountUsage?.unlimited ? '无限额度' : accountUsage ? `配额 ${accountUsage.quotaMonthly}` : '各 Token 合计'}
          />
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {newTokenId && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <Check className="h-4 w-4" />
            新 Token 已生成并复制到剪贴板，请妥善保存（仅显示一次完整内容）
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧 Token 列表 */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="我的 Token"
            description={`共 ${tokens.length} 个，有效 ${activeTokens.length} 个`}
          >
            {tokens.length === 0 ? (
              <EmptyState
                icon={Key}
                title="暂无 Token"
                description={account.dataPermissions.length === 0
                  ? '开通数据权限后即可生成 API Token'
                  : '生成 Token 后即可调用行情 API'}
                action={
                  account.dataPermissions.length === 0 ? (
                    <button type="button" onClick={() => onNavigate('marketplace')} className="btn-primary h-8 text-xs">
                      前往数据采购
                    </button>
                  ) : (
                    <button type="button" onClick={handleGenerate} disabled={busyId === 'generate'} className="btn-primary h-8 text-xs">
                      生成 Token
                    </button>
                  )
                }
              />
            ) : (
              <div className="space-y-3">
                {activeTokens.map((token, index) => (
                  <TokenCard
                    key={token.id}
                    token={token}
                    index={activeTokens.length - index}
                    usage={usageMap[token.id]}
                    productNames={productNames}
                    isNew={token.id === newTokenId}
                    copied={copiedId === token.id}
                    busy={busyId === token.id}
                    onCopy={() => handleCopy(token.id, token.token)}
                    onUseForPreview={() => handleSelectPreviewToken(token.id)}
                    isPreviewToken={token.id === previewTokenId}
                    onRefresh={() => handleRefreshPermissions(token.id)}
                    onRevoke={() => handleRevoke(token.id)}
                  />
                ))}

                {revokedTokens.length > 0 && (
                  <div className="pt-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      已吊销（{revokedTokens.length}）
                    </p>
                    <div className="space-y-2">
                      {revokedTokens.map((token) => (
                        <div
                          key={token.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 opacity-70"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs text-slate-500">{token.token.slice(0, 24)}…</p>
                            <p className="mt-1 text-[11px] text-slate-400">吊销于 {formatDate(token.createdAt)}</p>
                          </div>
                          <Badge variant="neutral">{tokenStatusLabel(token.status)}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* 右侧说明 */}
        <div className="space-y-6">
          <SectionCard title="已绑定权限" description="Token 继承账号当前数据权限">
            {account.dataPermissions.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="暂无权限"
                action={
                  <button type="button" onClick={() => onNavigate('marketplace')} className="btn-primary h-8 text-xs">
                    前往采购
                  </button>
                }
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {account.dataPermissions.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {productNames[id] ?? permissionLabel(id)}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="接口预览" description="使用上方 Token 直接测试行情 API">
            <div className="space-y-3">
              {activeTokens.length > 0 && (
                <select
                  value={previewTokenId}
                  onChange={(e) => handleSelectPreviewToken(e.target.value)}
                  className="input-field h-9 w-full text-xs"
                >
                  {activeTokens.map((token, index) => (
                    <option key={token.id} value={token.id}>
                      Token #{activeTokens.length - index}
                    </option>
                  ))}
                </select>
              )}
              <Input
                value={previewCode}
                onChange={(e) => setPreviewCode(e.target.value.toUpperCase())}
                placeholder="股票代码，如 AAPL"
                className="input-field h-9 font-mono text-sm"
              />
              <Input
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="X-API-Token"
                className="input-field h-9 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleLoadPreview}
                disabled={previewLoading || activeTokens.length === 0}
                className="btn-primary h-9 w-full text-xs"
              >
                {previewLoading ? '查询中…' : '查询行情'}
              </button>
              {activeTokens.length === 0 && (
                <p className="text-xs text-slate-500">请先生成 Token 后再测试接口</p>
              )}
            </div>
            {previewError && <div className="mt-3"><AlertBanner type="error" message={previewError} /></div>}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <PreviewMetric label="最新价" value={quote?.price ?? '—'} />
              <PreviewMetric label="分时" value={intradayBars.length} />
              <PreviewMetric label="K线" value={historyBars.length} />
            </div>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
{`GET /market-data/v1/quotes/${previewCode || 'AAPL'}?market=US
X-API-Token: ${apiToken ? '••••••••' : 'your_token_here'}`}
            </pre>
          </SectionCard>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">安全提示</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-500">
                  <li className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                    Token 等同于密码，请勿泄露或提交到代码仓库
                  </li>
                  <li>权限变更后点击「同步权限」更新 Token 快照</li>
                  <li>怀疑泄露时请立即吊销并重新生成</li>
                </ul>
              </div>
            </div>
          </div>

          {accountUsage && !accountUsage.unlimited && accountUsage.quotaMonthly && (
            <SectionCard title="账号配额" description={accountUsage.usageMonth}>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tabular-nums text-slate-900">{accountUsage.callCount}</p>
                  <p className="text-xs text-slate-500">/ {accountUsage.quotaMonthly} 次</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.min(100, Math.round((accountUsage.callCount / accountUsage.quotaMonthly) * 100))}%` }}
                  />
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}

function TokenStat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="px-6 py-4 text-center sm:text-left">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <EllipsisText className="mt-0.5 text-[11px] text-slate-400">{hint}</EllipsisText>
    </div>
  )
}

function TokenCard({
  token,
  index,
  usage,
  productNames,
  isNew,
  copied,
  busy,
  onCopy,
  onUseForPreview,
  isPreviewToken,
  onRefresh,
  onRevoke,
}: {
  token: ApiToken
  index: number
  usage?: number
  productNames: Record<string, string>
  isNew: boolean
  copied: boolean
  busy: boolean
  onCopy: () => void
  onUseForPreview: () => void
  isPreviewToken: boolean
  onRefresh: () => void
  onRevoke: () => void
}) {
  const displayToken = isNew ? token.token : `${token.token.slice(0, 12)}…${token.token.slice(-8)}`

  return (
    <div
      className={`rounded-xl border px-4 py-4 transition-colors ${
        isNew ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-blue-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">Token #{index}</p>
            <Badge variant="success">{tokenStatusLabel(token.status)}</Badge>
            {isNew && <Badge variant="info">新生成</Badge>}
            {isPreviewToken && <Badge variant="neutral">预览中</Badge>}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code
              className={`block min-w-0 flex-1 break-all rounded-lg px-3 py-2 font-mono text-xs ${
                isNew ? 'bg-white text-slate-800 ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-700'
              }`}
              title={token.token}
            >
              {displayToken}
            </code>
            <button
              type="button"
              title="复制 Token"
              onClick={onCopy}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-50 px-3 py-2">
          <Activity className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">本月</span>
          <span className="text-sm font-bold tabular-nums text-slate-900">{usage ?? 0}</span>
        </div>
      </div>

      {token.dataPermissions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {token.dataPermissions.map((id) => (
            <span key={id} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {productNames[id] ?? permissionLabel(id)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-[11px] text-slate-400">
          创建于 {formatDateTime(token.createdAt)}
          {token.expiresAt ? ` · 到期 ${formatDate(token.expiresAt)}` : ''}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onUseForPreview}
            disabled={busy}
            className="btn-secondary h-8 px-2.5 text-xs"
          >
            用于预览
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={busy}
            className="btn-secondary h-8 px-2.5 text-xs"
          >
            <RefreshCw className={`mr-1 inline h-3 w-3 ${busy ? 'animate-spin' : ''}`} />
            同步权限
          </button>
          <button
            type="button"
            onClick={onRevoke}
            disabled={busy}
            className="btn-secondary h-8 px-2.5 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-1 inline h-3 w-3" />
            吊销
          </button>
        </div>
      </div>
    </div>
  )
}
