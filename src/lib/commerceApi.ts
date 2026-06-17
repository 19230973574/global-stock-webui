const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type ApiResponse<T> = {
  code: string
  message: string
  data: T
}

export type PurchaseOrder = {
  id: string
  orderNo: string
  accountEmail: string
  permission: string
  status: 'pending_review' | 'approved' | 'rejected' | 'cancelled'
  source: string
  submittedAt: number
  reviewedAt?: number
  reviewedBy?: string
  rejectReason?: string
}

export type Subscription = {
  id: string
  accountEmail: string
  productId: string
  productName: string
  status: string
  startsAt: number
  expiresAt?: number
  orderId?: string
  grantedBy?: string
}

export type ApiUsage = {
  usageMonth: string
  callCount: number
  quotaMonthly: number | null
  unlimited: boolean
}

export type AuditLog = {
  id: string
  action: string
  operatorEmail: string
  targetEmail: string
  resourceType: string
  resourceId: string
  detail: string
  before?: string
  after?: string
  createdAt: number
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('global_stock_token')
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>
  if (!response.ok || payload.code !== '0') {
    throw new Error(payload.message || '接口请求失败')
  }
  return payload.data
}

export function createPurchaseOrder(permission: string) {
  return fetch(`${API_BASE_URL}/commerce/v1/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ permission }),
  }).then((r) => parseResponse<PurchaseOrder>(r))
}

export function fetchMyOrders() {
  return fetch(`${API_BASE_URL}/commerce/v1/orders`, { headers: authHeaders() })
    .then((r) => parseResponse<PurchaseOrder[]>(r))
}

export function cancelPurchaseOrder(orderId: string) {
  return fetch(`${API_BASE_URL}/commerce/v1/orders/${orderId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then((r) => parseResponse<void>(r))
}

export function fetchPendingOrders(status = 'pending_review', limit = 100) {
  return fetch(`${API_BASE_URL}/admin/v1/orders?status=${status}&limit=${limit}`, {
    headers: authHeaders(),
  }).then((r) => parseResponse<PurchaseOrder[]>(r))
}

export function approveOrder(orderId: string) {
  return fetch(`${API_BASE_URL}/admin/v1/orders/${orderId}/approve`, {
    method: 'POST',
    headers: authHeaders(),
  }).then((r) => parseResponse<PurchaseOrder>(r))
}

export function rejectOrder(orderId: string, reason: string) {
  return fetch(`${API_BASE_URL}/admin/v1/orders/${orderId}/reject`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  }).then((r) => parseResponse<PurchaseOrder>(r))
}

export function fetchAuditLogs(type?: string, limit = 50) {
  const typeParam = type ? `&type=${encodeURIComponent(type)}` : ''
  return fetch(`${API_BASE_URL}/admin/v1/audit-logs?limit=${limit}${typeParam}`, {
    headers: authHeaders(),
  }).then((r) => parseResponse<AuditLog[]>(r))
}

export function fetchMySubscriptions() {
  return fetch(`${API_BASE_URL}/commerce/v1/subscriptions`, { headers: authHeaders() })
    .then((r) => parseResponse<Subscription[]>(r))
}

export function fetchMyUsage() {
  return fetch(`${API_BASE_URL}/commerce/v1/usage`, { headers: authHeaders() })
    .then((r) => parseResponse<ApiUsage>(r))
}

export function createBundleOrder(bundleId: string) {
  return createPurchaseOrder(`bundle:${bundleId}`)
}

export function orderPermissionLabel(permission: string, bundleNames: Record<string, string> = {}) {
  if (permission.startsWith('bundle:')) {
    const id = permission.slice('bundle:'.length)
    return bundleNames[id] ? `套餐 · ${bundleNames[id]}` : `套餐 · ${id}`
  }
  return permissionLabel(permission)
}

function permissionLabel(id: string): string {
  const labels: Record<string, string> = {
    us_market_open: '美股开盘',
    us_realtime: '美股实时',
    us_timeshare: '美股分时',
    us_history: '美股历史',
    a_realtime: 'A股实时',
    etf_history: 'ETF 历史',
    us_quant_zone: '美股量化专区',
  }
  return labels[id] ?? id
}

export const ORDER_STATUS_LABELS: Record<PurchaseOrder['status'], string> = {
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已取消',
}
