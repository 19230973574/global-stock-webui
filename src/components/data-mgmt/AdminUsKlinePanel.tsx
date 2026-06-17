import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { fetchUsDataMgmtOverview, type UsDataMgmtOverview } from '../../lib/adminDataMgmtApi'
import {
  DataMgmtPanelHeader,
  DataMgmtStatCard,
  DataMgmtStatGrid,
  DataMgmtTabs,
} from './dataMgmtUi'
import { KlineFetchTaskSection } from './KlineManageSections'
import { KlineHistoryBarsSection } from './KlineHistoryBarsSection'

type TabId = 'bars' | 'tasks'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'bars', label: 'K 线明细' },
  { id: 'tasks', label: '补数任务' },
]

export function AdminUsKlinePanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlDate = searchParams.get('date') ?? undefined
  const urlTab = searchParams.get('tab')

  const [overview, setOverview] = useState<UsDataMgmtOverview | null>(null)
  const [refreshEpoch, setRefreshEpoch] = useState(0)
  const [activeTab, setActiveTab] = useState<TabId>(urlTab === 'tasks' ? 'tasks' : 'bars')
  const [barsDateFilter, setBarsDateFilter] = useState<string | undefined>(urlDate)

  const loadOverview = useCallback(async (refresh = false) => {
    try {
      setOverview(await fetchUsDataMgmtOverview(refresh))
    } catch {
      setOverview(null)
    }
  }, [])

  useEffect(() => { loadOverview(false) }, [loadOverview])

  useEffect(() => {
    if (urlTab === 'tasks') setActiveTab('tasks')
    if (urlDate) {
      setBarsDateFilter(urlDate)
      setActiveTab('bars')
    }
  }, [urlDate, urlTab])

  const clearDateFilter = () => {
    setBarsDateFilter(undefined)
    if (searchParams.has('date')) {
      searchParams.delete('date')
      setSearchParams(searchParams, { replace: true })
    }
  }

  return (
    <div className="space-y-3">
      <DataMgmtPanelHeader
        icon={BarChart3}
        title="K 线明细 · 美股"
        subtitle={
          overview
            ? `${overview.klineCodeCount} 只有数据 · 共 ${overview.historyBarCount.toLocaleString()} 条 · 最新 ${overview.latestTradeDate ?? '—'}`
            : '浏览 us_kline_history 明细记录'
        }
        onRefresh={() => {
          loadOverview(true)
          setRefreshEpoch((e) => e + 1)
        }}
      />

      {overview && (
        <DataMgmtStatGrid>
          <DataMgmtStatCard label="有 K 线标的" value={String(overview.klineCodeCount)} />
          <DataMgmtStatCard label="K 线总条数" value={overview.historyBarCount.toLocaleString()} />
          <DataMgmtStatCard label="市场最新日" value={overview.latestTradeDate ?? '—'} />
        </DataMgmtStatGrid>
      )}

      <DataMgmtTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'bars' && (
        <KlineHistoryBarsSection
          filterDate={barsDateFilter}
          onClearDateFilter={clearDateFilter}
          refreshEpoch={refreshEpoch}
        />
      )}
      {activeTab === 'tasks' && <KlineFetchTaskSection />}
    </div>
  )
}
