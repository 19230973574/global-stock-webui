const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type ApiResponse<T> = { code: string; message: string; data: T }

export type DataProduct = {
  id: string
  name: string
  group: string
  description: string
  priceAmount: number
  priceCurrency: string
  priceDisplay: string
  periodMonths: number
  requires: string[]
  apiQuotaMonthly: number | null
  status: string
}

export type ProductBundle = {
  id: string
  name: string
  description: string
  productIds: string[]
  priceAmount: number | null
  priceCurrency: string
  priceDisplay: string
  apiQuotaMonthly: number | null
  popular: boolean
  status: string
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
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

export function fetchProducts() {
  return fetch(`${API_BASE_URL}/catalog/v1/products`, { headers: authHeaders() })
    .then((r) => parseResponse<DataProduct[]>(r))
}

export function fetchBundles() {
  return fetch(`${API_BASE_URL}/catalog/v1/bundles`, { headers: authHeaders() })
    .then((r) => parseResponse<ProductBundle[]>(r))
}
