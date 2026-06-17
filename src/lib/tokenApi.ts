const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type ApiResponse<T> = { code: string; message: string; data: T }

export type ApiToken = {
  id: string
  token: string
  accountEmail: string
  dataPermissions: string[]
  status: string
  createdAt: number
  expiresAt?: number
}

export type TokenUsage = {
  tokenId: string
  usageMonth: string
  callCount: number
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

export function listTokens() {
  return fetch(`${API_BASE_URL}/tokens/v1`, { headers: authHeaders() })
    .then((r) => parseResponse<ApiToken[]>(r))
}

export function generateToken() {
  return fetch(`${API_BASE_URL}/tokens/v1`, { method: 'POST', headers: authHeaders() })
    .then((r) => parseResponse<ApiToken>(r))
}

export function revokeToken(tokenId: string) {
  return fetch(`${API_BASE_URL}/tokens/v1/${tokenId}`, { method: 'DELETE', headers: authHeaders() })
    .then((r) => parseResponse<void>(r))
}

export function rotateToken(tokenId: string) {
  return fetch(`${API_BASE_URL}/tokens/v1/${tokenId}/rotate`, { method: 'POST', headers: authHeaders() })
    .then((r) => parseResponse<ApiToken>(r))
}

export function refreshTokenPermissions(tokenId: string) {
  return fetch(`${API_BASE_URL}/tokens/v1/${tokenId}/refresh-permissions`, { method: 'POST', headers: authHeaders() })
    .then((r) => parseResponse<ApiToken>(r))
}

export function fetchTokenUsage(tokenId: string) {
  return fetch(`${API_BASE_URL}/tokens/v1/${tokenId}/usage`, { headers: authHeaders() })
    .then((r) => parseResponse<TokenUsage>(r))
}
