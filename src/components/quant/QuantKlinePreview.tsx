import { useEffect, useMemo, useState } from 'react'
import { LineChart, RefreshCw, TrendingDown, TrendingUp, X } from 'lucide-react'
import type { KlineBar } from '../../lib/marketApi'
import { AlertBanner } from '../ui/page-elements'

type KlineFetcher = (code: string, limit?: number) => Promise<KlineBar[]>

const LIMIT_OPTIONS = [60, 120]

const MA_LINES = [
  { period: 5, color: '#f59e0b', label: 'MA5', legendClass: 'bg-amber-500' },
  { period: 10, color: '#06b6d4', label: 'MA10', legendClass: 'bg-cyan-500' },
  { period: 20, color: '#6366f1', label: 'MA20', legendClass: 'bg-indigo-500' },
  { period: 30, color: '#ec4899', label: 'MA30', legendClass: 'bg-pink-500' },
  { period: 60, color: '#78716c', label: 'MA60', legendClass: 'bg-stone-500' },
] as const

export function QuantKlinePreview({
  code,
  name,
  market = 'US',
  title,
  onClose,
  fetchBars,
}: {
  code: string | null
  name?: string | null
  market?: string
  title?: string
  onClose: () => void
  fetchBars: KlineFetcher
}) {
  const [bars, setBars] = useState<KlineBar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(60)

  useEffect(() => {
    if (!code) return
    let cancelled = false
    setLoading(true)
    setError('')
    fetchBars(code, limit)
      .then((data) => { if (!cancelled) setBars(data) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : '加载失败') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [code, limit, fetchBars])

  if (!code) return null

  const latest = bars[bars.length - 1]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <LineChart className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="font-mono text-lg font-bold text-slate-900">{code}</p>
                  {name && (
                    <p className="text-sm font-medium text-slate-600">{name}</p>
                  )}
                  {latest?.close != null && (
                    <p className="text-lg font-bold tabular-nums text-slate-900">{latest.close.toFixed(2)}</p>
                  )}
                  {latest?.changePct != null && (
                    <span className={`inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums ${
                      latest.changePct >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {latest.changePct >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {latest.changePct > 0 ? '+' : ''}{latest.changePct.toFixed(2)}%
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{title ?? `${market} · 日 K`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {LIMIT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setLimit(n)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      limit === n ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {n}日
                  </button>
                ))}
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {latest && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {[
                { label: '开', value: latest.open },
                { label: '高', value: latest.high },
                { label: '低', value: latest.low },
                { label: '收', value: latest.close },
                { label: '量', value: latest.volume, fmt: formatVolume },
                { label: '日期', value: latest.time?.slice(0, 10), raw: true },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                  <p className="text-[10px] text-slate-400">{item.label}</p>
                  <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-800">
                    {item.raw
                      ? (item.value ?? '—')
                      : item.fmt
                        ? item.fmt(item.value as number | null)
                        : formatPrice(item.value as number | null)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 图表区 */}
        <div className="overflow-y-auto p-5">
          {error && <AlertBanner type="error" message={error} />}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              加载 K 线…
            </div>
          ) : bars.length === 0 ? (
            <p className="py-20 text-center text-sm text-slate-500">暂无 K 线数据</p>
          ) : (
            <KlineChart bars={bars} />
          )}
        </div>
      </div>
    </div>
  )
}

function KlineChart({ bars }: { bars: KlineBar[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const chart = useMemo(() => buildChartModel(bars), [bars])
  if (!chart) return null

  const { points, minPrice, maxPrice, priceTicks, dateTicks, maLines, maxVolume } = chart
  const hover = hoverIndex != null ? points[hoverIndex] : points[points.length - 1]

  const pricePath = (values: (number | null)[]) =>
    values
      .map((v, i) => {
        if (v == null) return null
        const x = chart.x(i)
        const y = priceY(v, minPrice, maxPrice, chart.priceHeight, chart.paddingTop, chart.paddingBottom)
        return `${i === 0 || values[i - 1] == null ? 'M' : 'L'} ${x} ${y}`
      })
      .filter(Boolean)
      .join(' ')

  return (
    <div className="space-y-2">
      {/* 悬停信息条 */}
      {hover && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
          <span className="font-medium text-slate-600">{hover.label}</span>
          <OHLCItem label="开" value={hover.open} />
          <OHLCItem label="高" value={hover.high} color="text-emerald-600" />
          <OHLCItem label="低" value={hover.low} color="text-red-600" />
          <OHLCItem label="收" value={hover.close} bold />
          {hover.volume != null && (
            <span className="text-slate-500">量 <span className="font-semibold tabular-nums text-slate-700">{formatVolume(hover.volume)}</span></span>
          )}
        </div>
      )}

      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="w-full select-none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="volGradUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="volGradDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* 价格区背景 */}
        <rect x={chart.paddingLeft} y={chart.paddingTop} width={chart.plotWidth} height={chart.priceHeight} fill="#f8fafc" rx="4" />

        {/* 价格网格 */}
        {priceTicks.map((tick) => {
          const y = priceY(tick, minPrice, maxPrice, chart.priceHeight, chart.paddingTop, chart.paddingBottom)
          return (
            <g key={tick}>
              <line x1={chart.paddingLeft} y1={y} x2={chart.paddingLeft + chart.plotWidth} y2={y} stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="4 3" />
              <text x={chart.paddingLeft - 6} y={y + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8">{tick.toFixed(2)}</text>
            </g>
          )
        })}

        {/* MA 均线 */}
        {maLines.map(({ period, color, values }) =>
          values.some((v) => v != null) ? (
            <path
              key={period}
              d={pricePath(values)}
              fill="none"
              stroke={color}
              strokeWidth="1.2"
              opacity="0.85"
            />
          ) : null
        )}

        {/* K 线蜡烛 */}
        {points.map((point) => {
          const x = chart.x(point.index)
          const openY = priceY(point.open, minPrice, maxPrice, chart.priceHeight, chart.paddingTop, chart.paddingBottom)
          const closeY = priceY(point.close, minPrice, maxPrice, chart.priceHeight, chart.paddingTop, chart.paddingBottom)
          const highY = priceY(point.high, minPrice, maxPrice, chart.priceHeight, chart.paddingTop, chart.paddingBottom)
          const lowY = priceY(point.low, minPrice, maxPrice, chart.priceHeight, chart.paddingTop, chart.paddingBottom)
          const bullish = point.close >= point.open
          const upColor = '#059669'
          const downColor = '#dc2626'
          const color = bullish ? upColor : downColor
          const bodyTop = Math.min(openY, closeY)
          const bodyHeight = Math.max(Math.abs(closeY - openY), 1)
          const cw = Math.max(chart.candleWidth, 2)
          const isHover = hoverIndex === point.index

          return (
            <g
              key={point.index}
              opacity={hoverIndex == null || isHover ? 1 : 0.45}
              onMouseEnter={() => setHoverIndex(point.index)}
            >
              <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth={isHover ? 1.8 : 1.2} />
              <rect
                x={x - cw / 2}
                y={bodyTop}
                width={cw}
                height={bodyHeight}
                fill={bullish ? upColor : downColor}
                stroke={color}
                strokeWidth={0.6}
                rx="0.5"
              />
              {/* 透明热区 */}
              <rect
                x={x - chart.step / 2}
                y={chart.paddingTop}
                width={chart.step}
                height={chart.priceHeight}
                fill="transparent"
              />
            </g>
          )
        })}

        {/* 悬停十字线 */}
        {hoverIndex != null && (
          <line
            x1={chart.x(hoverIndex)}
            y1={chart.paddingTop}
            x2={chart.x(hoverIndex)}
            y2={chart.paddingTop + chart.priceHeight}
            stroke="#64748b"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            pointerEvents="none"
          />
        )}

        {/* 成交量区 */}
        <rect
          x={chart.paddingLeft}
          y={chart.volTop}
          width={chart.plotWidth}
          height={chart.volHeight}
          fill="#f1f5f9"
          rx="4"
        />
        {points.map((point) => {
          if (point.volume == null || maxVolume === 0) return null
          const x = chart.x(point.index)
          const barH = (point.volume / maxVolume) * (chart.volHeight - 4)
          const bullish = point.close >= point.open
          const y = chart.volTop + chart.volHeight - barH
          const vw = Math.max(chart.candleWidth * 0.9, 1.5)
          return (
            <rect
              key={`vol-${point.index}`}
              x={x - vw / 2}
              y={y}
              width={vw}
              height={barH}
              fill={bullish ? 'url(#volGradUp)' : 'url(#volGradDown)'}
              opacity={hoverIndex == null || hoverIndex === point.index ? 1 : 0.4}
              onMouseEnter={() => setHoverIndex(point.index)}
            />
          )
        })}

        {/* 日期刻度 */}
        {dateTicks.map(({ index, label }) => (
          <text
            key={index}
            x={chart.x(index)}
            y={chart.height - 4}
            textAnchor="middle"
            fontSize="8.5"
            fill="#94a3b8"
          >
            {label}
          </text>
        ))}
      </svg>

      {/* 图例 */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {MA_LINES.map(({ label, legendClass }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`inline-block h-0.5 w-4 rounded ${legendClass}`} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2 rounded-sm bg-emerald-600" />涨</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2 rounded-sm bg-red-600" />跌</span>
        </div>
        <span>{points.length} 根 · {points[0]?.label} ~ {points[points.length - 1]?.label}</span>
      </div>
    </div>
  )
}

function OHLCItem({ label, value, color, bold }: { label: string; value: number; color?: string; bold?: boolean }) {
  return (
    <span className="text-slate-500">
      {label}{' '}
      <span className={`tabular-nums ${color ?? 'text-slate-700'} ${bold ? 'font-bold' : 'font-semibold'}`}>
        {value.toFixed(2)}
      </span>
    </span>
  )
}

function buildChartModel(bars: KlineBar[]) {
  const valid = bars.filter((b) => b.open != null && b.high != null && b.low != null && b.close != null)
  if (valid.length === 0) return null

  const closes = valid.map((b) => b.close!)
  const maLines = MA_LINES.map(({ period, color, label }) => ({
    period,
    color,
    label,
    values: calcMa(closes, period),
  }))

  const allMaValues = maLines.flatMap(({ values }) => values.filter(Boolean) as number[])
  const allPrices = valid.flatMap((b) => [b.high!, b.low!, ...allMaValues])
  const rawMin = Math.min(...allPrices)
  const rawMax = Math.max(...allPrices)
  const pad = (rawMax - rawMin) * 0.06 || rawMax * 0.01
  const minPrice = rawMin - pad
  const maxPrice = rawMax + pad

  const priceTicks = buildPriceTicks(minPrice, maxPrice, 5)
  const maxVolume = Math.max(...valid.map((b) => b.volume ?? 0))

  const paddingLeft = 52
  const paddingRight = 12
  const paddingTop = 12
  const paddingBottom = 22
  const priceHeight = 200
  const volGap = 8
  const volHeight = 56
  const volTop = paddingTop + priceHeight + volGap
  const height = volTop + volHeight + paddingBottom
  const plotWidth = Math.max(valid.length * 10, 480)
  const width = paddingLeft + plotWidth + paddingRight
  const step = plotWidth / Math.max(valid.length - 1, 1)
  const candleWidth = Math.min(Math.max(step * 0.65, 3), 10)

  const points = valid.map((bar, index) => ({
    index,
    label: bar.time?.slice(5, 10) ?? bar.time?.slice(0, 10) ?? '',
    fullDate: bar.time?.slice(0, 10) ?? '',
    open: bar.open!,
    high: bar.high!,
    low: bar.low!,
    close: bar.close!,
    volume: bar.volume,
  }))

  const dateTicks = buildDateTicks(points, 6)

  const x = (index: number) => paddingLeft + index * step

  return {
    points, minPrice, maxPrice, priceTicks, dateTicks, maLines, maxVolume,
    width, height, paddingLeft, paddingRight, paddingTop, paddingBottom,
    priceHeight, volTop, volHeight, volGap, plotWidth, step, candleWidth, x,
  }
}

function calcMa(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null
    const slice = closes.slice(i - period + 1, i + 1)
    return slice.reduce((s, v) => s + v, 0) / period
  })
}

function buildPriceTicks(min: number, max: number, count: number): number[] {
  const range = max - min
  if (range <= 0) return [min]
  const step = range / count
  return Array.from({ length: count + 1 }, (_, i) => min + step * i)
}

function buildDateTicks(points: { index: number; fullDate: string; label: string }[], maxTicks: number) {
  if (points.length <= maxTicks) return points.map((p) => ({ index: p.index, label: p.label }))
  const step = Math.floor(points.length / maxTicks)
  const ticks = []
  for (let i = 0; i < points.length; i += step) {
    ticks.push({ index: points[i].index, label: points[i].label })
  }
  const last = points[points.length - 1]
  if (ticks[ticks.length - 1]?.index !== last.index) {
    ticks.push({ index: last.index, label: last.label })
  }
  return ticks
}

function priceY(price: number, min: number, max: number, plotH: number, padTop: number, padBottom: number) {
  if (max === min) return padTop + plotH / 2
  const ratio = (price - min) / (max - min)
  return padTop + plotH - padBottom - ratio * (plotH - padBottom)
}

function formatPrice(value: number | null | undefined) {
  if (value == null) return '—'
  return value.toFixed(2)
}

function formatVolume(value: number | null | undefined) {
  if (value == null) return '—'
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}
