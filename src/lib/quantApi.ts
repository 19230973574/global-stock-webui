import type { KlineBar } from './marketApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type ApiResponse<T> = {
  code: string
  message: string
  data: T
}

export type QuantSignal = {
  code: string
  name?: string | null
  market: string
  tradeDate: string
  close: number | null
  high: number | null
  low: number | null
  windowDays: number
  period?: string
  signalType: 'new_high' | 'new_low' | 'period_high'
  priorExtreme: number
  breakPct: number
  marketCap?: number | null
}

export type QuantScreen = {
  tradeDate: string
  newHighs: QuantSignal[]
  newLows: QuantSignal[]
  periodHighs: Record<string, QuantSignal[]>
}

export type QuantScreenPage = {
  tradeDate: string
  signalType: string
  period?: string | null
  windowDays: number
  page: number
  pageSize: number
  total: number
  minMarketCap?: number | null
  maxMarketCap?: number | null
  sortBy?: string | null
  sortOrder?: string | null
  items: QuantSignal[]
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

export function fetchQuantScreen(days = 20, limit = 100) {
  return fetch(`${API_BASE_URL}/quant/v1/us/screen?days=${days}&limit=${limit}`, { headers: authHeaders() })
    .then((r) => parseResponse<QuantScreen>(r))
}

export function fetchQuantScreenPage(params: {
  signalType: 'new_high' | 'new_low' | 'period_high'
  days?: number
  period?: string
  page?: number
  pageSize?: number
  code?: string
  minMarketCap?: number
  maxMarketCap?: number
  sortBy?: 'break_pct' | 'close'
  sortOrder?: 'asc' | 'desc'
}) {
  const query = new URLSearchParams()
  query.set('signalType', params.signalType)
  if (params.days != null) query.set('days', String(params.days))
  if (params.period) query.set('period', params.period)
  if (params.page != null) query.set('page', String(params.page))
  if (params.pageSize != null) query.set('pageSize', String(params.pageSize))
  if (params.code?.trim()) query.set('code', params.code.trim().toUpperCase())
  if (params.minMarketCap != null) query.set('minMarketCap', String(params.minMarketCap))
  if (params.maxMarketCap != null) query.set('maxMarketCap', String(params.maxMarketCap))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)
  return fetch(`${API_BASE_URL}/quant/v1/us/screen/page?${query.toString()}`, { headers: authHeaders() })
    .then((r) => parseResponse<QuantScreenPage>(r))
}

export function fetchQuantKline(code: string, limit = 60) {
  const query = new URLSearchParams({ code: code.toUpperCase(), limit: String(limit) })
  return fetch(`${API_BASE_URL}/quant/v1/us/kline?${query.toString()}`, { headers: authHeaders() })
    .then((r) => parseResponse<KlineBar[]>(r))
}

export function fetchQuantWindows() {
  return fetch(`${API_BASE_URL}/quant/v1/us/windows`, { headers: authHeaders() })
    .then((r) => parseResponse<number[]>(r))
}

export const PERIOD_LABELS: Record<string, string> = {
  '1m': '一月新高',
  '3m': '三月新高',
  '6m': '半年新高',
  '1y': '一年新高',
}
