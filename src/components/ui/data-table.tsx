import { cn } from '../../lib/utils'
import { EllipsisText } from './ellipsis-text'

export type DataTableColumn<T> = {
  key: string
  title: string
  width: string
  align?: 'left' | 'center' | 'right'
  render: (row: T) => React.ReactNode
  mono?: boolean
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  className,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  empty?: React.ReactNode
  className?: string
}) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-slate-200', className)}>
      <table className="data-table">
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={{ width: col.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="bg-white hover:bg-slate-50/80">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    col.mono && 'font-mono text-xs',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {typeof col.render(row) === 'string' ? (
                    <EllipsisText>{col.render(row) as string}</EllipsisText>
                  ) : (
                    col.render(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
