import { useCallback, useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { fetchUsDataMgmtOverview, type UsDataMgmtOverview } from '../../lib/adminDataMgmtApi'
import { DataMgmtPanelHeader } from './dataMgmtUi'
import { KlineRangeRebuildSection } from './KlineRangeRebuildSection'
import { KlineHistoryDatesSection } from './KlineHistoryDatesSection'

export function AdminUsKlineDatesPanel() {
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
    <div className="space-y-3">
      <DataMgmtPanelHeader
        icon={CalendarDays}
        title="K 线日历 · 美股"
        subtitle={
          overview
            ? `最新 ${overview.latestTradeDate ?? '—'} · 区间重建或浏览交易日覆盖`
            : '按交易日管理覆盖、补数与删除'
        }
        onRefresh={handleRefresh}
      />

      <KlineRangeRebuildSection onRebuilt={() => setRefreshEpoch((e) => e + 1)} />
      <KlineHistoryDatesSection refreshEpoch={refreshEpoch} />
    </div>
  )
}
