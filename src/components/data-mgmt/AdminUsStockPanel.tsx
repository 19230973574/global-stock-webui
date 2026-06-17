import { useCallback, useEffect, useState } from 'react'
import { List } from 'lucide-react'
import { fetchUsDataMgmtOverview, type UsDataMgmtOverview } from '../../lib/adminDataMgmtApi'
import {
  DataMgmtPanelHeader,
  DataMgmtStatCard,
  DataMgmtStatGrid,
} from './dataMgmtUi'
import { UsStockListSection } from './UsStockListSection'

export function AdminUsStockPanel() {
  const [overview, setOverview] = useState<UsDataMgmtOverview | null>(null)
  const [refreshEpoch, setRefreshEpoch] = useState(0)

  const loadOverview = useCallback(async (refresh = false) => {
    try {
      setOverview(await fetchUsDataMgmtOverview(refresh))
    } catch {
      setOverview(null)
    }
  }, [])

  useEffect(() => { loadOverview(false) }, [loadOverview])

  const handleRefresh = () => {
    loadOverview(true)
    setRefreshEpoch((e) => e + 1)
  }

  return (
    <div className="space-y-5">
      <DataMgmtPanelHeader
        icon={List}
        title="股票代码 · 美股"
        subtitle={
          overview
            ? `共 ${overview.stockCount} 只 · 数据源 us_stock_info`
            : '浏览与搜索美股标的及 K 线覆盖情况'
        }
        onRefresh={handleRefresh}
      />

      {overview && (
        <DataMgmtStatGrid>
          <DataMgmtStatCard label="股票总数" value={String(overview.stockCount)} />
          <DataMgmtStatCard label="有 K 线标的" value={String(overview.klineCodeCount)} />
          <DataMgmtStatCard label="市场最新日" value={overview.latestTradeDate ?? '—'} />
        </DataMgmtStatGrid>
      )}

      <UsStockListSection refreshEpoch={refreshEpoch} />
    </div>
  )
}
