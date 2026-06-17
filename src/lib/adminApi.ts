import type { UserAccount } from './authApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type ApiResponse<T> = { code: string; message: string; data: T }

export type AdminDashboardStats = {
  totalUsers: number
  activeUsers: number
  activeTokens: number
  totalPermissions: number
  pendingOrders: number
  activeSubscriptions: number
  monthlyApiCalls: number
  expiringSoon: number
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

export function fetchAdminDashboardStats() {
  return fetch(`${API_BASE_URL}/admin/v1/dashboard/stats`, { headers: authHeaders() })
    .then((r) => parseResponse<AdminDashboardStats>(r))
}

export function updateUserStatus(email: string, status: 'active' | 'disabled') {
  return fetch(`${API_BASE_URL}/admin/v1/users/${encodeURIComponent(email)}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  }).then((r) => parseResponse<UserAccount>(r))
}
