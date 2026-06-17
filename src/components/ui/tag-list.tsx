import { EllipsisText } from './ellipsis-text'

export function TagList({ items, empty = '暂无' }: { items: string[]; empty?: string }) {
  if (items.length === 0) {
    return <span className="text-xs text-slate-400">{empty}</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="inline-block max-w-[160px] truncate rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600"
          title={item}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export function TagListBlue({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <EllipsisText
          key={item}
          className="inline-block max-w-[140px] rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[11px] text-blue-700 ring-1 ring-blue-100"
        >
          {item}
        </EllipsisText>
      ))}
    </div>
  )
}
