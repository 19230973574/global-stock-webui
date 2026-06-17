import { useCallback, useEffect, useState } from 'react'
import {
  approveOrder,
  fetchAuditLogs,
  fetchPendingOrders,
  rejectOrder,
  ORDER_STATUS_LABELS,
  orderPermissionLabel,
  type AuditLog,
  type PurchaseOrder,
} from '../../lib/commerceApi'
import { fetchBundles, type ProductBundle } from '../../lib/catalogApi'
import { Badge } from '../ui/badge'
import { DataTable } from '../ui/data-table'
import { AlertBanner, EmptyState, SectionCard } from '../ui/page-elements'
import { Check, ClipboardList, RefreshCw, X } from 'lucide-react'

function formatTime(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ACTION_LABELS: Record<string, string> = {
  'order.submitted': '提交采购',
  'order.approved': '审核通过',
  'order.rejected': '审核驳回',
  'order.cancelled': '取消申请',
  'permission.granted': '开通权限',
  'permission.revoked': '撤销权限',
  'user.status_updated': '账号状态变更',
  'token.generated': '生成 Token',
  'token.revoked': '吊销 Token',
  'token.refreshed': '同步 Token 权限',
}

export function OrderReviewPanel({
  onChanged,
}: {
  onChanged?: () => Promise<void>
}) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bundles, setBundles] = useState<ProductBundle[]>([])
  const bundleNames = Object.fromEntries(bundles.map((b) => [b.id, b.name]))

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [pending, audit, bundleList] = await Promise.all([
        fetchPendingOrders(),
        fetchAuditLogs(undefined, 30),
        fetchBundles().catch(() => [] as ProductBundle[]),
      ])
      setOrders(pending)
      setLogs(audit)
      setBundles(bundleList)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (order: PurchaseOrder) => {
    setBusyId(order.id)
    setError('')
    try {
      await approveOrder(order.id)
      await load()
      await onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '审核失败')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (orderId: string) => {
    setBusyId(orderId)
    setError('')
    try {
      await rejectOrder(orderId, rejectReason)
      setRejectingId(null)
      setRejectReason('')
      await load()
      await onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '驳回失败')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="待审核采购"
        description="客户提交的数据权限申请，审核通过后自动开通"
        action={
          <button type="button" onClick={load} disabled={loading} className="btn-secondary h-8 px-2.5 text-xs">
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        }
      >
        {error && <div className="mb-4"><AlertBanner type="error" message={error} /></div>}
        <DataTable
          columns={[
            { key: 'orderNo', title: '订单号', width: '18%', mono: true, render: (o) => o.orderNo },
            { key: 'user', title: '申请人', width: '22%', render: (o) => o.accountEmail },
            { key: 'perm', title: '数据权限', width: '16%', render: (o) => orderPermissionLabel(o.permission, bundleNames) },
            { key: 'time', title: '提交时间', width: '14%', render: (o) => formatTime(o.submittedAt) },
            {
              key: 'actions',
              title: '操作',
              width: '30%',
              render: (o) => (
                <div className="flex flex-wrap items-center gap-2">
                  {rejectingId === o.id ? (
                    <>
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="驳回原因（可选）"
                        className="input-field h-8 min-w-[140px] flex-1 text-xs"
                      />
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => handleReject(o.id)}
                        className="btn-secondary h-8 px-2 text-xs text-red-600"
                      >
                        确认驳回
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRejectingId(null); setRejectReason('') }}
                        className="btn-secondary h-8 px-2 text-xs"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => handleApprove(o)}
                        className="btn-primary h-8 px-2.5 text-xs"
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        通过
                      </button>
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => setRejectingId(o.id)}
                        className="btn-secondary h-8 px-2.5 text-xs"
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        驳回
                      </button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          rows={orders}
          rowKey={(o) => o.id}
          empty={
            <EmptyState
              icon={ClipboardList}
              title="暂无待审核订单"
              description="客户提交采购申请后将显示在这里"
            />
          }
        />
      </SectionCard>

      <SectionCard title="最近操作记录" description="权限与订单相关审计日志">
        <DataTable
          columns={[
            { key: 'action', title: '操作', width: '14%', render: (l) => ACTION_LABELS[l.action] ?? l.action },
            { key: 'operator', title: '操作人', width: '20%', render: (l) => l.operatorEmail },
            { key: 'target', title: '对象', width: '20%', render: (l) => l.targetEmail },
            { key: 'detail', title: '详情', width: '32%', render: (l) => l.detail },
            { key: 'time', title: '时间', width: '14%', render: (l) => formatTime(l.createdAt) },
          ]}
          rows={logs}
          rowKey={(l) => l.id}
          empty={<EmptyState icon={ClipboardList} title="暂无审计记录" />}
        />
      </SectionCard>
    </div>
  )
}

export function OrderStatusBadge({ status }: { status: PurchaseOrder['status'] }) {
  const variant = status === 'approved' ? 'success' : status === 'pending_review' ? 'warning' : 'neutral'
  return <Badge variant={variant}>{ORDER_STATUS_LABELS[status]}</Badge>
}
