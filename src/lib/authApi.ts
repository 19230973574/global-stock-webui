const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type ApiResponse<T> = {
  code: string
  message: string
  data: T
}

export type AuthSession = {
  token: string
  email: string
  name: string
  status: string
  role: string
  dataPermissions: string[]
}

export type UserAccount = {
  email: string
  name: string
  status: string
  role: string
  dataPermissions: string[]
  lastLoginAt?: number
  createdAt?: number
}

export type ApiToken = {
  token: string
  accountEmail: string
  dataPermissions: string[]
  status: string
  createdAt: number
  expiresAt?: number
}

export type DashboardStats = {
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = localStorage.getItem('global_stock_token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>
  if (!response.ok || payload.code !== '0') {
    if (payload.code === 'UNAUTHORIZED' || response.status === 401) {
      localStorage.removeItem('global_stock_token')
      localStorage.removeItem('global_stock_user')
    }
    throw new Error(payload.message || '接口请求失败')
  }
  return payload.data
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return parseResponse<T>(response)
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders(),
  })
  return parseResponse<T>(response)
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  return parseResponse<T>(response)
}

async function del<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  return parseResponse<T>(response)
}

export function registerAccount(data: { name: string; email: string; password: string }) {
  return post<void>('/auth/v1/registrations', data)
}

export function activateAccount(data: { email: string; code: string }) {
  return post<void>('/auth/v1/activations', data)
}

export function loginWithEmail(data: { email: string; password: string }) {
  return post<AuthSession>('/auth/v1/sessions', data)
}

export function logoutSession() {
  return post<void>('/auth/v1/logout')
}

export function fetchCurrentProfile() {
  return get<AuthSession>('/auth/v1/me')
}

export function fetchDashboardStats() {
  return get<DashboardStats>('/admin/v1/dashboard/stats')
}

export function fetchUsers() {
  return get<UserAccount[]>('/auth/v1/users')
}

export function createUser(data: { name: string; email: string; password: string; role: string }) {
  return post<UserAccount>('/auth/v1/users', data)
}

export function updateUserRole(email: string, role: string) {
  return patch<UserAccount>(`/auth/v1/users/${encodeURIComponent(email)}/role`, { role })
}

export function requestPasswordReset(data: { email: string }) {
  return post<void>('/auth/v1/password-reset-requests', data)
}

export function resetPassword(data: { email: string; token: string; password: string }) {
  return post<void>('/auth/v1/password-resets', data)
}

export function grantDataPermission(data: { email: string; permission: string }) {
  return post<void>('/auth/v1/data-permissions', data)
}

export function revokeDataPermission(data: { email: string; permission: string }) {
  return del<void>('/auth/v1/data-permissions', data)
}

export function generateApiToken(data: { email: string }) {
  return post<ApiToken>('/auth/v1/api-tokens', data)
}

export function listApiTokens(email: string) {
  return get<ApiToken[]>(`/auth/v1/api-tokens?email=${encodeURIComponent(email)}`)
}
