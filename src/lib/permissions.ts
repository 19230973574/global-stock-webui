export type PermissionId =
  | 'us_market_open'
  | 'us_realtime'
  | 'us_timeshare'
  | 'us_history'
  | 'a_realtime'
  | 'etf_history'
  | 'us_quant_zone'

export const PERMISSION_CATALOG: Array<{
  id: PermissionId
  name: string
  group: string
  description: string
}> = [
  { id: 'us_market_open', name: '美股开盘', group: '美股', description: 'API 调用的基础准入权限' },
  { id: 'us_realtime', name: '美股实时', group: '美股', description: 'Level 1 实时报价与成交量' },
  { id: 'us_timeshare', name: '美股分时', group: '美股', description: '分钟级分时走势数据' },
  { id: 'us_history', name: '美股历史', group: '美股', description: '日 K 与历史成交数据' },
  { id: 'a_realtime', name: 'A股实时', group: 'A股', description: '沪深实时行情快照' },
  { id: 'etf_history', name: 'ETF 历史', group: 'ETF', description: 'ETF 历史净值与成交' },
  { id: 'us_quant_zone', name: '美股量化专区', group: '量化专区', description: '新高新低、周期突破等量化筛选' },
]

export function permissionLabel(id: string): string {
  return PERMISSION_CATALOG.find((p) => p.id === id)?.name ?? id
}
