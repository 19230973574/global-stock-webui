import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Search, List } from 'lucide-react'
import { fetchUsStocks, type UsStockPage } from '../../lib/adminDataMgmtApi'
import { formatMarketCap } from '../quant/QuantFilterPanel'
import {
  dataMgmtInputClass,
  dataMgmtLabelClass,
} from './dataMgmtUi'
import { AlertBanner, EmptyState, SectionCard } from '../ui/page-elements'
import { Pagination } from '../ui/pagination'

export function UsStockListSection({ refreshEpoch = 0 }: { refreshEpoch?: number }) {
  const [codeKeyword, setCodeKeyword] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [pageData, setPageData] = useState<UsStockPage | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadStocks = useCallback(async (refresh = false) => {
    setLoading(true)
    setError('')
    try {
      setPageData(await fetchUsStocks({
        code: appliedCode || undefined,
        page,
        pageSize,
        refresh,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载股票列表失败')
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }, [appliedCode, page, pageSize])

  useEffect(() => { loadStocks(false) }, [loadStocks])

  useEffect(() => {
    if (refreshEpoch > 0) loadStocks(true)
  }, [refreshEpoch, loadStocks])

  const handleSearch = () => {
    setPage(1)
    setAppliedCode(codeKeyword.trim().toUpperCase())
  }

  return (
    <div className="space-y-5">
      {error && <AlertBanner type="error" message={error} />}

      <SectionCard title="查询条件">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[200px] flex-1">
            <span className={dataMgmtLabelClass}>搜索代码 / 名称</span>
            <input
              type="text"
              value={codeKeyword}
              onChange={(e) => setCodeKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="AAPL"
              className={dataMgmtInputClass}
            />
          </label>
          <button type="button" onClick={handleSearch} className="btn-primary h-9 px-3 text-xs">
            <Search className="mr-1 inline h-3.5 w-3.5" />
            搜索
          </button>
          <button type="button" onClick={() => loadStocks(true)} disabled={loading} className="btn-secondary h-9 px-3 text-xs">
            <RefreshCw className={`mr-1 inline h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="美股股票代码"
        description={pageData ? `共 ${pageData.total} 只 · 第 ${pageData.page} 页` : undefined}
        noPadding
      >
        <div className="p-3">
          {loading && !pageData ? (
            <p className="py-6 text-center text-xs text-slate-500">加载中…</p>
          ) : !pageData?.items.length ? (
            <EmptyState icon={List} title="暂无股票" description="请确认爬虫已写入 us_stock_info" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-500">
                      <th className="px-3 py-2 font-medium">代码</th>
                      <th className="px-3 py-2 font-medium">名称</th>
                      <th className="px-3 py-2 font-medium">市值</th>
                      <th className="px-3 py-2 font-medium">K线最新日</th>
                      <th className="px-3 py-2 font-medium">K线条数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.items.map((stock) => (
                      <tr key={stock.code} className="border-b border-slate-50 hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-900">{stock.code}</td>
                        <td className="max-w-[160px] truncate px-3 py-2 text-xs text-slate-600" title={stock.name}>{stock.name ?? '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-700">{formatMarketCap(stock.marketCap)}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{stock.klineLatestDate ?? '—'}</td>
                        <td className="px-3 py-2 text-xs tabular-nums text-slate-600">{stock.klineBarCount ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={pageData.page}
                pageSize={pageData.pageSize}
                total={pageData.total}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
