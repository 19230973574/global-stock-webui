const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type ApiResponse<T> = { code: string; message: string; data: T }

export type UsDataMgmtOverview = {
  market: string
  stockCount: number
  klineCodeCount: number
  historyBarCount: number
  latestTradeDate: string
  dateDistribution: Array<{ date: string; count: number }>
}

export type UsStockItem = {
  code: string
  symbol?: string
  name?: string
  marketCap?: number
  klineLatestDate?: string
  klineBarCount?: number
}

export type UsStockPage = {
  page: number
  pageSize: number
  total: number
  items: UsStockItem[]
}

export type KlineTaskProgress = {
  totalCodes: number
  doneCodes: number
  currentCode?: string | null
  savedBars: number
  failedCodes: number
}

export type KlineTaskResult = {
  savedBars: number
  failedCodes?: string[]
  errorSummary?: string | null
}

export type KlineFetchTask = {
  id: string
  type: string
  status: string
  market: string
  period: string
  codes: string[]
  startDate: string
  endDate: string
  progress?: KlineTaskProgress
  result?: KlineTaskResult
  createdBy?: string
  createdAt?: number
  startedAt?: number
  finishedAt?: number
  updatedAt?: number
  errorMessage?: string | null
}

export type KlineFetchTaskPage = {
  page: number
  pageSize: number
  total: number
  items: KlineFetchTask[]
}

export type KlineDeleteResult = {
  deletedCount: number
  previewCount: number
  codes: string[]
  startDate?: string
  endDate?: string
  preview: boolean
}

export type KlineHistoryBar = {
  code: string
  market: string
  period: string
  time: string
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
  turnover?: number
  change?: number
  changePct?: number
}

export type KlineHistoryBarPage = {
  page: number
  pageSize: number
  total: number
  items: KlineHistoryBar[]
}

export type KlineTradeDateItem = {
  date: string
  barCount: number
  syncStatus?: string | null
  syncTaskStartDate?: string | null
  syncTaskEndDate?: string | null
  syncStartedAt?: number | null
  syncFinishedAt?: number | null
}

export type KlineTradeDatePage = {
  page: number
  pageSize: number
  total: number
  items: KlineTradeDateItem[]
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

export function fetchUsDataMgmtOverview(refresh = false) {
  const query = refresh ? '?refresh=true' : ''
  return fetch(`${API_BASE_URL}/admin/v1/data-mgmt/us/overview${query}`, { headers: authHeaders() })
    .then((r) => parseResponse<UsDataMgmtOverview>(r))
}

export function fetchUsStocks(params?: { code?: string; page?: number; pageSize?: number; refresh?: boolean }) {
  const query = new URLSearchParams()
  if (params?.code?.trim()) query.set('code', params.code.trim().toUpperCase())
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))
  if (params?.refresh) query.set('refresh', 'true')
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return fetch(`${API_BASE_URL}/admin/v1/data-mgmt/us/stocks${suffix}`, { headers: authHeaders() })
    .then((r) => parseResponse<UsStockPage>(r))
}

export function fetchKlineHistoryBars(params?: {
  code?: string
  date?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  refresh?: boolean
}) {
  const query = new URLSearchParams()
  if (params?.code?.trim()) query.set('code', params.code.trim().toUpperCase())
  if (params?.date?.trim()) query.set('date', params.date.trim())
  if (params?.startDate?.trim()) query.set('startDate', params.startDate.trim())
  if (params?.endDate?.trim()) query.set('endDate', params.endDate.trim())
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))
  if (params?.refresh) query.set('refresh', 'true')
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return fetch(`${API_BASE_URL}/admin/v1/data-mgmt/us/kline/bars${suffix}`, { headers: authHeaders() })
    .then((r) => parseResponse<KlineHistoryBarPage>(r))
}

export function fetchKlineTradeDates(params?: {
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  refresh?: boolean
}) {
  const query = new URLSearchParams()
  if (params?.startDate?.trim()) query.set('startDate', params.startDate.trim())
  if (params?.endDate?.trim()) query.set('endDate', params.endDate.trim())
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))
  if (params?.refresh) query.set('refresh', 'true')
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return fetch(`${API_BASE_URL}/admin/v1/data-mgmt/us/kline/dates${suffix}`, { headers: authHeaders() })
    .then((r) => parseResponse<KlineTradeDatePage>(r))
}

export function createKlineFetchTask(body: {
  codes: string[]
  startDate: string
  endDate: string
  market?: string
  period?: string
}) {
  return fetch(`${API_BASE_URL}/admin/v1/data-mgmt/us/kline/fetch-tasks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then((r) => parseResponse<KlineFetchTask>(r))
}

export function fetchKlineFetchTasks(params?: { status?: string; page?: number; pageSize?: number }) {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return fetch(`${API_BASE_URL}/admin/v1/data-mgmt/us/kline/fetch-tasks${suffix}`, { headers: authHeaders() })
    .then((r) => parseResponse<KlineFetchTaskPage>(r))
}

export function cancelKlineFetchTask(taskId: string) {
  return fetch(`${API_BASE_URL}/admin/v1/data-mgmt/us/kline/fetch-tasks/${taskId}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  }).then((r) => parseResponse<KlineFetchTask>(r))
}

export function deleteKlineData(body: {
  codes?: string[]
  startDate?: string
  endDate?: string
  dates?: string[]
  confirm?: boolean
  market?: string
  period?: string
}) {
  return fetch(`${API_BASE_URL}/admin/v1/data-mgmt/us/kline/delete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then((r) => parseResponse<KlineDeleteResult>(r))
}

export type KlineRebuildResult = {
  preview: boolean
  previewDeleteCount: number
  deletedCount: number
  allCodes: boolean
  codeCount: number
  startDate: string
  endDate: string
  taskCount: number
  taskIds: string[]
  codesPreview?: string[]
}

export function rebuildKlineData(body: {
  codes?: string[]
  allCodes?: boolean
  startDate: string
  endDate: string
  confirm?: boolean
  confirmPhrase?: string
  market?: string
  period?: string
}) {
  return fetch(`${API_BASE_URL}/admin/v1/data-mgmt/us/kline/rebuild`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then((r) => parseResponse<KlineRebuildResult>(r))
}

export const KLINE_TASK_TYPE_LABEL: Record<string, string> = {
  FETCH: '增量拉取',
  REBUILD: '区间重建',
}

export const KLINE_TASK_STATUS_LABEL: Record<string, string> = {
  PENDING: '排队中',
  RUNNING: '执行中',
  SUCCESS: '成功',
  PARTIAL: '部分成功',
  FAILED: '失败',
  CANCELLED: '已取消',
}

export const KLINE_TASK_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  RUNNING: 'bg-blue-100 text-blue-700',
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}
