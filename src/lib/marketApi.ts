const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type ApiResponse<T> = {
  code: string
  message: string
  data: T
}

export type Quote = {
  code: string
  market: string
  price: number | null
  open: number | null
  high: number | null
  low: number | null
  volume: number | null
  turnover: number | null
  change: number | null
  changePct: number | null
  quoteTime: string | null
}

export type KlineBar = {
  code: string
  market: string
  period: string
  time: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
  turnover: number | null
  change: number | null
  changePct: number | null
}

async function request<T>(path: string, apiToken?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: apiToken
      ? {
          'X-API-Token': apiToken,
        }
      : {},
  })
  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || payload.code !== '0') {
    throw new Error(payload.message || '接口请求失败')
  }

  return payload.data
}

export function fetchQuote(code: string, market = 'US', apiToken?: string) {
  return request<Quote>(`/market-data/v1/quotes/${code}?market=${market}`, apiToken)
}

export function fetchIntradayBars(code: string, market = 'US', period = '1m', limit = 60, apiToken?: string) {
  return request<KlineBar[]>(`/market-data/v1/intraday-bars?code=${code}&market=${market}&period=${period}&limit=${limit}`, apiToken)
}

export function fetchHistoryBars(code: string, market = 'US', period = '1d', limit = 60, apiToken?: string) {
  return request<KlineBar[]>(`/market-data/v1/history-bars?code=${code}&market=${market}&period=${period}&limit=${limit}`, apiToken)
}
